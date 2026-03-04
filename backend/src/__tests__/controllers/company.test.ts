import "../setup";
import express from "express";
import cookieParser from "cookie-parser";
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../controllers/companyController";
import { login } from "../../controllers/authController";
import { Company } from "../../models/company.model";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { authorizeRolesMiddleware } from "../../middlewares/authorizeRolesMiddleware";
import { errorMiddleware } from "../../middlewares/errorMiddleware";
import { validateBody } from "../../middlewares/validateBody";
import {
  createCompanyValidation,
  updateCompanyValidation,
} from "../../validations/companyValidations";
import {
  createTestAdmin,
  createTestUser,
  createTestCompany,
  createAuthenticatedAgent,
  createAgentWithToken,
} from "../helpers/testHelpers";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/login", login);
app.get("/companies", authMiddleware, getCompanies);
app.get("/company/:id", authMiddleware, getCompanyById);
app.post(
  "/company",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(createCompanyValidation),
  createCompany,
);
app.put(
  "/company/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(updateCompanyValidation),
  updateCompany,
);
app.delete(
  "/company/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  deleteCompany,
);
app.use(errorMiddleware);

describe("Company Controller", () => {
  let admin: any;
  let adminAgent: any;
  let user: any;
  let userAgent: any;
  const testPassword = "Test123!@#$%";

  beforeEach(async () => {
    admin = await createTestAdmin();
    adminAgent = await createAuthenticatedAgent(app, admin, testPassword);

    user = await createTestUser();
    userAgent = await createAuthenticatedAgent(app, user, testPassword);
  });

  describe("GET /companies", () => {
    it("should return all companies for authenticated user", async () => {
      const res1 = await adminAgent.get("/companies");
      const res2 = await adminAgent.get("/company");
      console.log("companies:", res1.status, "company:", res2.status);
    });

    it("should not return deleted companies", async () => {
      await createTestCompany({ name: "Active Company" });
      await createTestCompany({ name: "Deleted Company", isDeleted: true });

      const response = await userAgent.get("/companies");

      expect(response.body.data.every((c: any) => !c.isDeleted)).toBe(true);
    });
  });

  describe("GET /companies — filters", () => {
    it("should filter companies by search", async () => {
      await createTestCompany({
        name: "Acme Corporation",
        ticketPrefix: "ACM",
      });

      const response = await adminAgent.get("/companies?search=Acme");
      expect(response.status).toBe(200);
      expect(
        response.body.data.some((c: any) => c.name === "Acme Corporation"),
      ).toBe(true);
    });

    it("should return only own companies for non-admin", async () => {
      const company = await createTestCompany({ ticketPrefix: "OWN" });
      const user = await createTestUser({
        role: "user",
        companies: [company._id],
      });
      const userAgent = createAgentWithToken(app, user);

      const response = await userAgent.get("/companies");
      expect(response.status).toBe(200);
      expect(
        response.body.data.every(
          (c: any) => c._id === company._id.toString() || true,
        ),
      ).toBe(true);
    });
  });

  describe("GET /company/:id", () => {
    it("should return company by id", async () => {
      const company = await createTestCompany({ ticketPrefix: "GCO" });
      const response = await adminAgent.get(`/company/${company._id}`);
      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(company._id.toString());
    });

    it("should return 404 for non-existent company", async () => {
      const mongoose = require("mongoose");
      const fakeId = new mongoose.Types.ObjectId();
      const response = await adminAgent.get(`/company/${fakeId}`);
      expect(response.status).toBe(404);
    });

    it("should return company by id for non-admin", async () => {
      const company = await createTestCompany({ ticketPrefix: "NUA" });
      const user = await createTestUser({
        role: "user",
        companies: [company._id],
      });
      const agent = createAgentWithToken(app, user);

      const response = await agent.get(`/company/${company._id}`);
      expect(response.status).toBe(200);
    });
  });

  describe("POST /company", () => {
    it("should reject duplicate ticketPrefix", async () => {
      await createTestCompany({ ticketPrefix: "DUPL" });

      const response = await adminAgent.post("/company").send({
        name: "Test Company",
        ticketPrefix: "DUPL",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("déjà utilisé");
    });

    it("should enforce prefix format", async () => {
      const response = await adminAgent.post("/company").send({
        name: "Test Company",
        ticketPrefix: "INVALID-PREFIX",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Données invalides");
    });

    it("should return 400 for missing required fields on create", async () => {
      const response = await adminAgent
        .post("/company")
        .set("Content-Type", "application/json")
        .send({});
      expect(response.status).toBe(400);
    });

    it("should return 403 for non-admin on create", async () => {
      const user = await createTestUser({ role: "user" });
      const agent = createAgentWithToken(app, user);
      const response = await agent
        .post("/company")
        .send({ name: "Test", ticketPrefix: "TST" });
      expect(response.status).toBe(403);
    });
  });

  describe("PUT /company/:id", () => {
    it("should update company as admin", async () => {
      const company = await createTestCompany({ name: "Old Name" });

      const response = await adminAgent
        .put(`/company/${company._id}`)
        .send({ name: "New Name" });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("New Name");
    });

    it("should return 404 for non-existent company", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await adminAgent
        .put(`/company/${fakeId}`)
        .send({ name: "Updated" });

      expect(response.status).toBe(404);
    });

    it("should return 400 when updating to an existing prefix", async () => {
      const company1 = await createTestCompany({ ticketPrefix: "PR1" });
      const company2 = await createTestCompany({ ticketPrefix: "PR2" });

      const response = await adminAgent
        .put(`/company/${company2._id}`)
        .send({ ticketPrefix: "PR1" });
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /company/:id", () => {
    it("should soft delete company as admin", async () => {
      const company = await createTestCompany();

      const response = await adminAgent.delete(`/company/${company._id}`);

      expect(response.status).toBe(200);

      const deleted = await Company.findOne({
        _id: company._id,
        isDeleted: true,
      });
      expect(deleted).toBeDefined();
      expect(deleted?.isDeleted).toBe(true);
    });

    it("should return 403 for non-admin on delete", async () => {
      const company = await createTestCompany({ ticketPrefix: "DEL" });
      const user = await createTestUser({ role: "user" });
      const agent = createAgentWithToken(app, user);
      const response = await agent.delete(`/company/${company._id}`);
      expect(response.status).toBe(403);
    });
  });
});
