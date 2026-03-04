import app from "../../index";
import {
  createTestUser,
  createTestAdmin,
  createTestCompany,
  createAgentWithToken,
} from "../helpers/testHelpers";
import { Ticket } from "../../models/ticket.model";
import { Message } from "../../models/message.model";
import mongoose from "mongoose";

describe("Message Controller", () => {
  let adminAgent: any;
  let userAgent: any;
  let otherUserAgent: any;
  let adminUser: any;
  let company1: any;
  let company2: any;
  let ticket1: any;

  beforeEach(async () => {
    company1 = await createTestCompany({ ticketPrefix: "MSG1" });
    company2 = await createTestCompany({ ticketPrefix: "MSG2" });

    adminUser = await createTestAdmin();
    adminAgent = createAgentWithToken(app, adminUser);

    const user = await createTestUser({
      role: "user",
      companies: [company1._id],
    });
    userAgent = createAgentWithToken(app, user);

    const otherUser = await createTestUser({
      role: "user",
      companies: [company2._id],
    });
    otherUserAgent = createAgentWithToken(app, otherUser);

    ticket1 = await Ticket.create({
      title: "Test ticket",
      description: "Description",
      company: company1._id,
      createdBy: adminUser._id,
      ticketNumber: 1,
      year: new Date().getFullYear(),
    });
  });

  describe("GET /ticket/:id/messages", () => {
    it("should return messages for authorized user", async () => {
      await Message.create({
        ticket: ticket1._id,
        author: adminUser._id,
        content: "Hello",
      });

      const response = await adminAgent.get(
        `/api/ticket/${ticket1._id}/messages`,
      );
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return messages for user of the same company", async () => {
      const response = await userAgent.get(
        `/api/ticket/${ticket1._id}/messages`,
      );
      expect(response.status).toBe(200);
    });

    it("should reject access for user of different company", async () => {
      const response = await otherUserAgent.get(
        `/api/ticket/${ticket1._id}/messages`,
      );
      expect(response.status).toBe(403);
    });

    it("should return 404 for non-existent ticket", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await adminAgent.get(`/api/ticket/${fakeId}/messages`);
      expect(response.status).toBe(404);
    });

    it("should support pagination", async () => {
      for (let i = 0; i < 5; i++) {
        await Message.create({
          ticket: ticket1._id,
          author: adminUser._id,
          content: `Message ${i}`,
        });
      }

      const response = await adminAgent.get(
        `/api/ticket/${ticket1._id}/messages?page=1&limit=3`,
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
      expect(response.body.total).toBe(5);
    });
  });

  describe("POST /ticket/:id/messages", () => {
    it("should create a message for authorized user", async () => {
      const response = await adminAgent
        .post(`/api/ticket/${ticket1._id}/messages`)
        .send({ content: "Test message" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe("Test message");
      expect(response.body.data.author).toBeDefined();
    });

    it("should reject empty message", async () => {
      const response = await adminAgent
        .post(`/api/ticket/${ticket1._id}/messages`)
        .send({ content: "   " });
      expect(response.status).toBe(400);
    });

    it("should reject message without content field", async () => {
      const response = await adminAgent
        .post(`/api/ticket/${ticket1._id}/messages`)
        .send({});
      expect(response.status).toBe(400);
    });

    it("should reject message for unauthorized company", async () => {
      const response = await otherUserAgent
        .post(`/api/ticket/${ticket1._id}/messages`)
        .send({ content: "Unauthorized message" });
      expect(response.status).toBe(403);
    });

    it("should allow user of same company to post", async () => {
      const response = await userAgent
        .post(`/api/ticket/${ticket1._id}/messages`)
        .send({ content: "User message" });
      expect(response.status).toBe(201);
    });
  });
});
