import request from "supertest";
import app from "../../index";
import {
  createTestUser,
  createTestAdmin,
  createTestSupport,
  createTestCompany,
  createAgentWithToken,
} from "../helpers/testHelpers";
import { Ticket } from "../../models/ticket.model";

describe("Dashboard Controller", () => {
  let adminAgent: any;
  let supportAgent: any;
  let userAgent: any;
  let company1: any;
  let adminUser: any;

  beforeEach(async () => {
    company1 = await createTestCompany({ ticketPrefix: "DASH" });

    adminUser = await createTestAdmin();
    adminAgent = createAgentWithToken(app, adminUser);

    const support = await createTestSupport([company1._id]);
    supportAgent = createAgentWithToken(app, support);

    const user = await createTestUser({
      role: "user",
      companies: [company1._id],
    });
    userAgent = createAgentWithToken(app, user);

    await Ticket.create([
      {
        title: "Ticket 1",
        description: "Desc",
        company: company1._id,
        createdBy: adminUser._id,
        ticketNumber: 1,
        year: new Date().getFullYear(),
        status: "open",
      },
      {
        title: "Ticket 2",
        description: "Desc",
        company: company1._id,
        createdBy: adminUser._id,
        ticketNumber: 2,
        year: new Date().getFullYear(),
        status: "in_progress",
      },
    ]);
  });

  describe("GET /dashboard", () => {
    it("should return admin dashboard with all stats", async () => {
      const response = await adminAgent.get("/api/dashboard");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toMatchObject({
        totalTickets: expect.any(Number),
        openTickets: expect.any(Number),
        inProgressTickets: expect.any(Number),
        resolvedTickets: expect.any(Number),
        closedTickets: expect.any(Number),
        totalUsers: expect.any(Number),
        totalCompanies: expect.any(Number),
      });
      expect(Array.isArray(response.body.data.recentTickets)).toBe(true);
    });

    it("should return support dashboard with company-scoped stats", async () => {
      const response = await supportAgent.get("/api/dashboard");

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toMatchObject({
        totalTickets: expect.any(Number),
        openTickets: expect.any(Number),
        assignedToMe: expect.any(Number),
      });
      expect(response.body.data.stats.totalUsers).toBeUndefined();
      expect(response.body.data.stats.totalCompanies).toBeUndefined();
    });

    it("should return user dashboard with company-scoped stats", async () => {
      const response = await userAgent.get("/api/dashboard");

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toMatchObject({
        totalTickets: expect.any(Number),
        openTickets: expect.any(Number),
        resolvedTickets: expect.any(Number),
      });
      expect(response.body.data.stats.assignedToMe).toBeUndefined();
      expect(response.body.data.stats.totalUsers).toBeUndefined();
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/dashboard");
      expect(response.status).toBe(401);
    });

    it("should include recent tickets limited to 5", async () => {
      const response = await adminAgent.get("/api/dashboard");
      expect(response.body.data.recentTickets.length).toBeLessThanOrEqual(5);
    });
  });
});
