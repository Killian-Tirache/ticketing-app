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
      await createTestCompany({ name: "Company 1" });
      await createTestCompany({ name: "Company 2" });

      const response = await userAgent.get("/companies");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("should not return deleted companies", async () => {
      await createTestCompany({ name: "Active Company" });
      await createTestCompany({ name: "Deleted Company", isDeleted: true });

      const response = await userAgent.get("/companies");

      expect(response.body.data.every((c: any) => !c.isDeleted)).toBe(true);
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
  });
});
