import "../setup";
import express from "express";
import cookieParser from "cookie-parser";
import {
  getTickets,
  getTicketById,
  getTicketByRef,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../../controllers/ticketController";
import { Counter } from "../../models/counter.model";
import {
  createTestAdmin,
  createTestUser,
  createTestSupport,
  createTestCompany,
  createTestTicket,
  createAuthenticatedAgent,
  createAgentWithToken,
} from "../helpers/testHelpers";
import { Company } from "../../models/company.model";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { errorMiddleware } from "../../middlewares/errorMiddleware";
import { validateBody } from "../../middlewares/validateBody";
import {
  createTicketValidation,
  updateTicketValidation,
} from "../../validations/ticketValidations";
import { login } from "../../controllers/authController";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/login", login);

app.get("/tickets", authMiddleware, getTickets);
app.get("/ticket/:id", authMiddleware, getTicketById);
app.get("/ticket/ref/:ref", authMiddleware, getTicketByRef);
app.post(
  "/ticket",
  authMiddleware,
  validateBody(createTicketValidation),
  createTicket,
);
app.put(
  "/ticket/:id",
  authMiddleware,
  validateBody(updateTicketValidation),
  updateTicket,
);
app.delete("/ticket/:id", authMiddleware, deleteTicket);
app.use(errorMiddleware);

describe("Ticket Controller", () => {
  let admin: any;
  let adminAgent: any;
  let company1: any;
  let company2: any;
  let user1: any;
  let user1Agent: any;
  let support1: any;
  let support1Agent: any;
  const currentYear = new Date().getFullYear();
  const testPassword = "Test123!@#$%";

  beforeEach(async () => {
    await Counter.deleteMany({});

    company1 = await createTestCompany({
      name: "Company 1",
      ticketPrefix: "COMP1",
    });
    company2 = await createTestCompany({
      name: "Company 2",
      ticketPrefix: "COMP2",
    });

    admin = await createTestAdmin();
    adminAgent = await createAuthenticatedAgent(app, admin, testPassword);

    user1 = await createTestUser({
      email: "user1@test.com",
      companies: [company1._id],
    });
    user1Agent = await createAuthenticatedAgent(app, user1, testPassword);

    support1 = await createTestSupport([company1._id]);
    support1Agent = await createAuthenticatedAgent(app, support1, testPassword);
  });

  describe("POST /ticket", () => {
    it("should create ticket with auto-generated number and year", async () => {
      const response = await user1Agent.post("/ticket").send({
        title: "Test Ticket",
        description: "Description",
        company: company1._id.toString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticketNumber).toBe(1);
      expect(response.body.data.year).toBe(currentYear);
      expect(response.body.data.ticketRef).toBe(`COMP1-0001-${currentYear}`);
    });

    it("should increment ticket number per company", async () => {
      await user1Agent.post("/ticket").send({
        title: "Ticket 1",
        description: "Test",
        company: company1._id.toString(),
      });

      await user1Agent.post("/ticket").send({
        title: "Ticket 2",
        description: "Test",
        company: company1._id.toString(),
      });

      const response = await user1Agent.post("/ticket").send({
        title: "Ticket 3",
        description: "Test",
        company: company1._id.toString(),
      });

      expect(response.body.data.ticketNumber).toBe(3);
      expect(response.body.data.year).toBe(currentYear);
    });

    it("should have separate numbering for different companies", async () => {
      await adminAgent.post("/ticket").send({
        title: "Company 1 Ticket 1",
        description: "Test",
        company: company1._id.toString(),
      });

      await adminAgent.post("/ticket").send({
        title: "Company 1 Ticket 2",
        description: "Test",
        company: company1._id.toString(),
      });

      const response = await adminAgent.post("/ticket").send({
        title: "Company 2 Ticket 1",
        description: "Test",
        company: company2._id.toString(),
      });

      expect(response.body.data.ticketNumber).toBe(1);
      expect(response.body.data.ticketRef).toBe(`COMP2-0001-${currentYear}`);
    });

    it("should reject ticket for unauthorized company", async () => {
      const response = await user1Agent.post("/ticket").send({
        title: "Unauthorized",
        description: "Test",
        company: company2._id.toString(),
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain(
        "Vous ne pouvez pas créer de ticket pour cette entreprise",
      );
    });

    it("should allow admin to create ticket for any company", async () => {
      const response = await adminAgent.post("/ticket").send({
        title: "Admin Ticket",
        description: "Test",
        company: company2._id.toString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.data.ticketRef).toMatch(/^COMP2-\d{4}-\d{4}$/);
    });
  });

  describe("GET /tickets", () => {
    beforeEach(async () => {
      await createTestTicket({
        title: "Ticket Company 1 Current Year",
        company: company1._id,
        createdBy: user1._id,
        ticketNumber: 1,
        year: currentYear,
      });

      await createTestTicket({
        title: "Ticket Company 1 Last Year",
        company: company1._id,
        createdBy: user1._id,
        ticketNumber: 1,
        year: currentYear - 1,
      });

      await createTestTicket({
        title: "Ticket Company 2",
        company: company2._id,
        createdBy: admin._id,
        ticketNumber: 1,
        year: currentYear,
      });
    });

    it("should return all tickets for admin", async () => {
      const response = await adminAgent.get("/tickets");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });

    it("should return only company1 tickets for user1", async () => {
      const response = await user1Agent.get("/tickets");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(
        response.body.data.every(
          (t: any) => t.company._id === company1._id.toString(),
        ),
      ).toBe(true);
    });

    it("should filter by year", async () => {
      const response = await adminAgent.get(`/tickets?year=${currentYear}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every((t: any) => t.year === currentYear)).toBe(
        true,
      );
    });

    it("should filter by status", async () => {
      await createTestTicket({
        status: "closed",
        company: company1._id,
        createdBy: user1._id,
        ticketNumber: 2,
        year: currentYear,
      });

      const response = await user1Agent.get("/tickets?status=closed");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe("closed");
    });

    it("should return empty array for user without companies", async () => {
      const userNoCompany = await createTestUser({
        email: "nocompany@test.com",
        companies: [],
      });

      const userNoCompanyAgent = await createAuthenticatedAgent(
        app,
        userNoCompany,
        testPassword,
      );

      const response = await userNoCompanyAgent.get("/tickets");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe("GET /tickets — advanced filters", () => {
    it("should filter tickets by company for non-admin", async () => {
      const company1 = await createTestCompany({ ticketPrefix: "FC1" });
      const company2 = await createTestCompany({ ticketPrefix: "FC2" });
      const user = await createTestUser({
        role: "user",
        companies: [company1._id],
      });
      const userAgent = createAgentWithToken(app, user);

      await createTestTicket({ company: company1._id, createdBy: user._id });
      await createTestTicket({ company: company2._id, createdBy: user._id });

      const response = await userAgent.get(`/tickets?company=${company1._id}`);
      expect(response.status).toBe(200);
      expect(
        response.body.data.every(
          (t: any) => t.company._id === company1._id.toString(),
        ),
      ).toBe(true);
    });

    it("should search tickets by title", async () => {
      const company = await createTestCompany({ ticketPrefix: "SCH" });
      const admin = await createTestAdmin();
      const adminAgent = createAgentWithToken(app, admin);

      await createTestTicket({
        company: company._id,
        createdBy: admin._id,
        title: "Unique search title XYZ",
      });

      const response = await adminAgent.get(
        "/tickets?search=Unique+search+title",
      );
      expect(response.status).toBe(200);
      expect(
        response.body.data.some((t: any) => t.title.includes("Unique")),
      ).toBe(true);
    });

    it("should search tickets by ticketRef prefix", async () => {
      const company = await createTestCompany({ ticketPrefix: "REF" });
      const admin = await createTestAdmin();
      const agent = createAgentWithToken(app, admin);

      await createTestTicket({
        company: company._id,
        createdBy: admin._id,
        ticketNumber: 42,
      });

      const response = await agent.get("/tickets?search=REF-0042");
      expect(response.status).toBe(200);
    });

    it("should filter by company as admin", async () => {
      const response = await adminAgent.get(`/tickets?company=${company1._id}`);
      expect(response.status).toBe(200);
      expect(
        response.body.data.every(
          (t: any) => t.company._id === company1._id.toString(),
        ),
      ).toBe(true);
    });

    it("should ignore unauthorized company filter for non-admin", async () => {
      const response = await user1Agent.get(`/tickets?company=${company2._id}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe("GET /ticket/:id", () => {
    it("should return ticket for authorized user", async () => {
      const ticket = await createTestTicket({
        company: company1._id,
        createdBy: user1._id,
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await user1Agent.get(`/ticket/${ticket._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(ticket._id.toString());
      expect(response.body.data.year).toBe(currentYear);
    });

    it("should reject unauthorized access to ticket", async () => {
      const ticket = await createTestTicket({
        company: company2._id,
        createdBy: admin._id,
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await user1Agent.get(`/ticket/${ticket._id}`);

      expect(response.status).toBe(403);
    });

    it("should allow admin to view any ticket", async () => {
      const ticket = await createTestTicket({
        company: company2._id,
        createdBy: admin._id,
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await adminAgent.get(`/ticket/${ticket._id}`);

      expect(response.status).toBe(200);
    });
  });

  describe("GET /ticket/ref/:ref", () => {
    it("should find ticket by reference with year", async () => {
      const ticket = await createTestTicket({
        ticketNumber: 42,
        year: currentYear,
        company: company1._id,
        createdBy: user1._id,
      });

      const company = await Company.findById(company1._id);
      if (!company) {
        throw new Error("Company not found in test");
      }

      const ref = `${company.ticketPrefix}-0042-${currentYear}`;

      const response = await user1Agent.get(`/ticket/ref/${ref}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(ticket._id.toString());
      expect(response.body.data.ticketNumber).toBe(42);
      expect(response.body.data.year).toBe(currentYear);
    });

    it("should differentiate tickets with same number but different years", async () => {
      const ticket2025 = await createTestTicket({
        ticketNumber: 1,
        year: 2025,
        company: company1._id,
        createdBy: user1._id,
        title: "Ticket 2025",
      });

      const ticket2026 = await createTestTicket({
        ticketNumber: 1,
        year: 2026,
        company: company1._id,
        createdBy: user1._id,
        title: "Ticket 2026",
      });

      const company = await Company.findById(company1._id);
      if (!company) {
        throw new Error("Company not found in test");
      }

      const response2025 = await user1Agent.get(
        `/ticket/ref/${company.ticketPrefix}-0001-2025`,
      );

      expect(response2025.status).toBe(200);
      expect(response2025.body.data._id).toBe(ticket2025._id.toString());
      expect(response2025.body.data.title).toBe("Ticket 2025");

      const response2026 = await user1Agent.get(
        `/ticket/ref/${company.ticketPrefix}-0001-2026`,
      );

      expect(response2026.status).toBe(200);
      expect(response2026.body.data._id).toBe(ticket2026._id.toString());
      expect(response2026.body.data.title).toBe("Ticket 2026");
    });

    it("should return 400 for invalid reference format", async () => {
      const response = await user1Agent.get("/ticket/ref/invalid-format");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Format de référence invalide");
    });

    it("should return 400 for reference without year", async () => {
      const response = await user1Agent.get("/ticket/ref/COMP1-0001");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("attendu: PREFIX-XXXX-YYYY");
    });

    it("should return 404 for unknown prefix", async () => {
      const response = await user1Agent.get(
        `/ticket/ref/UNKNOWN-0001-${currentYear}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Aucune entreprise");
    });

    it("should return 404 for non-existent ticket", async () => {
      const company = await Company.findById(company1._id);
      if (!company) {
        throw new Error("Company not found in test");
      }

      const response = await user1Agent.get(
        `/ticket/ref/${company.ticketPrefix}-9999-${currentYear}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("introuvable");
    });

    it("should return 403 for user without company access", async () => {
      const company1 = await createTestCompany({ ticketPrefix: "RF1" });
      const company2 = await createTestCompany({ ticketPrefix: "RF2" });
      const admin = await createTestAdmin();
      const user = await createTestUser({
        role: "user",
        companies: [company2._id],
      });
      const userAgent = createAgentWithToken(app, user);

      await createTestTicket({
        company: company1._id,
        createdBy: admin._id,
        ticketNumber: 1,
        year: new Date().getFullYear(),
      });

      const response = await userAgent.get(
        `/ticket/ref/RF1-0001-${new Date().getFullYear()}`,
      );
      expect(response.status).toBe(403);
    });
  });

  describe("PUT /ticket/:id", () => {
    it("should update ticket for authorized user", async () => {
      const ticket = await createTestTicket({
        company: company1._id,
        createdBy: user1._id,
        status: "open",
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await user1Agent
        .put(`/ticket/${ticket._id}`)
        .send({ status: "in_progress" });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("in_progress");
      expect(response.body.data.year).toBe(currentYear);
      expect(response.body.data.ticketNumber).toBe(1);
    });

    it("should reject unauthorized update", async () => {
      const ticket = await createTestTicket({
        company: company2._id,
        createdBy: admin._id,
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await user1Agent
        .put(`/ticket/${ticket._id}`)
        .send({ status: "closed" });

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /ticket/:id — assignedTo validation", () => {
    it("should return 403 when support tries to assign to someone else", async () => {
      const company = await createTestCompany({ ticketPrefix: "AST" });
      const support = await createTestSupport([company._id]);
      const otherSupport = await createTestSupport([company._id]);
      const supportAgent = createAgentWithToken(app, support);
      const ticket = await createTestTicket({
        company: company._id,
        createdBy: support._id,
      });

      const response = await supportAgent
        .put(`/ticket/${ticket._id}`)
        .send({ assignedTo: otherSupport._id.toString() });
      expect(response.status).toBe(403);
    });

    it("should return 403 when admin assigns to user role", async () => {
      const company = await createTestCompany({ ticketPrefix: "AU1" });
      const admin = await createTestAdmin();
      const adminAgent = createAgentWithToken(app, admin);
      const user = await createTestUser({
        role: "user",
        companies: [company._id],
      });
      const ticket = await createTestTicket({
        company: company._id,
        createdBy: admin._id,
      });

      const response = await adminAgent
        .put(`/ticket/${ticket._id}`)
        .send({ assignedTo: user._id.toString() });
      expect(response.status).toBe(403);
    });

    it("should return 403 when admin assigns support from different company", async () => {
      const company1 = await createTestCompany({ ticketPrefix: "AU2" });
      const company2 = await createTestCompany({ ticketPrefix: "AU3" });
      const admin = await createTestAdmin();
      const adminAgent = createAgentWithToken(app, admin);
      const support = await createTestSupport([company2._id]); // support de company2
      const ticket = await createTestTicket({
        company: company1._id,
        createdBy: admin._id,
      });

      const response = await adminAgent
        .put(`/ticket/${ticket._id}`)
        .send({ assignedTo: support._id.toString() });
      expect(response.status).toBe(403);
    });

    it("should assign ticket when admin assigns valid support", async () => {
      const company = await createTestCompany({ ticketPrefix: "AU4" });
      const admin = await createTestAdmin();
      const adminAgent = createAgentWithToken(app, admin);
      const support = await createTestSupport([company._id]);
      const ticket = await createTestTicket({
        company: company._id,
        createdBy: admin._id,
      });

      const response = await adminAgent
        .put(`/ticket/${ticket._id}`)
        .send({ assignedTo: support._id.toString() });
      expect(response.status).toBe(200);
      expect(response.body.data.assignedTo).toBeDefined();
    });

    it("should unassign ticket with null assignedTo", async () => {
      const company = await createTestCompany({ ticketPrefix: "AU5" });
      const admin = await createTestAdmin();
      const adminAgent = createAgentWithToken(app, admin);
      const support = await createTestSupport([company._id]);
      const ticket = await createTestTicket({
        company: company._id,
        createdBy: admin._id,
        assignedTo: support._id,
      });

      const response = await adminAgent
        .put(`/ticket/${ticket._id}`)
        .send({ assignedTo: null });
      expect(response.status).toBe(200);
      expect(response.body.data.assignedTo).toBeNull();
    });
  });

  describe("DELETE /ticket/:id", () => {
    it("should allow admin to delete ticket", async () => {
      const ticket = await createTestTicket({
        company: company1._id,
        createdBy: user1._id,
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await adminAgent.delete(`/ticket/${ticket._id}`);

      expect(response.status).toBe(200);

      const Ticket = require("../../models/ticket.model").Ticket;
      const deleted = await Ticket.findById(ticket._id);
      expect(deleted).toBeNull();
    });

    it("should reject non-admin delete", async () => {
      const ticket = await createTestTicket({
        company: company1._id,
        createdBy: user1._id,
        ticketNumber: 1,
        year: currentYear,
      });

      const response = await support1Agent.delete(`/ticket/${ticket._id}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Year Reset Behavior", () => {
    it("should have separate counters for different years", async () => {
      await createTestTicket({
        company: company1._id,
        createdBy: admin._id,
        ticketNumber: 100,
        year: 2025,
      });

      const response = await user1Agent.post("/ticket").send({
        title: "First ticket of current year",
        description: "Test",
        company: company1._id.toString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.data.ticketNumber).toBe(1);
      expect(response.body.data.year).toBe(currentYear);
    });
  });
});
