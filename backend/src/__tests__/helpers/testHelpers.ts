import { User } from "../../models/user.model";
import { Company } from "../../models/company.model";
import { Ticket } from "../../models/ticket.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";

let companyCounter = 0;

export const createTestUser = async (data: any = {}) => {
  const defaultData = {
    firstName: "Test",
    lastName: "User",
    email: `test${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
    password: await bcrypt.hash("Test123!@#$%", 12),
    role: "user",
    companies: [],
    ...data,
  };

  return await User.create(defaultData);
};

export const createTestAdmin = async () => {
  return createTestUser({
    role: "admin",
    email: `admin-${Date.now()}@test.com`,
  });
};

export const createTestSupport = async (companies: any[] = []) => {
  return createTestUser({
    role: "support",
    email: `support${Date.now()}@test.com`,
    companies,
  });
};

export const createTestCompany = async (data: any = {}) => {
  companyCounter++;
  const defaultData = {
    name: data.name || `Test Company ${companyCounter}`,
    ticketPrefix:
      data.ticketPrefix || `TST${companyCounter.toString().padStart(3, "0")}`,
    ...data,
  };

  return await Company.create(defaultData);
};

export const createTestTicket = async (data: any = {}) => {
  const defaultData = {
    ticketNumber: 1,
    year: new Date().getFullYear(),
    title: "Test Ticket",
    description: "Test Description",
    status: "open",
    priority: "medium",
    type: "support",
    ...data,
  };

  return await Ticket.create(defaultData);
};

export const generateToken = (userId: string, role: string) => {
  const JWT_SECRET = process.env.JWT_SECRET || "test_secret_key_for_testing";
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

export const generateExpiredToken = (userId: string, role: string) => {
  const JWT_SECRET = process.env.JWT_SECRET || "test_secret_key_for_testing";
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "-1s" });
};

export const loginUser = async (app: any, email: string, password: string) => {
  const response = await request(app).post("/login").send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.body.error}`);
  }

  const cookies = response.headers["set-cookie"];
  return cookies;
};

export const createAuthenticatedAgent = async (
  app: any,
  user: any,
  password: string = "Test123!@#$%",
) => {
  const agent = request.agent(app);

  const response = await agent.post("/login").send({
    email: user.email,
    password,
  });

  if (response.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${response.body.error}`);
  }

  return agent;
};
