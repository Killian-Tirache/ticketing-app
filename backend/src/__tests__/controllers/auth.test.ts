import "../setup";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { login, logout, getMe } from "../../controllers/authController";
import {
  createTestUser,
  generateToken,
  createAuthenticatedAgent,
} from "../helpers/testHelpers";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { errorMiddleware } from "../../middlewares/errorMiddleware";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/login", login);
app.post("/logout", authMiddleware, logout);
app.get("/me", authMiddleware, getMe);
app.use(errorMiddleware);

describe("Auth Controller", () => {
  const testPassword = "Test123!@#$%";

  describe("POST /login", () => {
    it("should login successfully with valid credentials", async () => {
      const user = await createTestUser({
        email: "login@test.com",
      });

      const response = await request(app).post("/login").send({
        email: "login@test.com",
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(user._id.toString());

      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/token=/);
    });

    it("should return 401 for invalid credentials", async () => {
      await createTestUser({ email: "test@test.com" });

      const response = await request(app).post("/login").send({
        email: "test@test.com",
        password: "WrongPassword123!",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain("incorrect");
    });

    it("should return 401 for non-existent user", async () => {
      const response = await request(app).post("/login").send({
        email: "notfound@test.com",
        password: testPassword,
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain("incorrect");
    });
  });

  describe("POST /logout", () => {
    it("should logout successfully", async () => {
      const user = await createTestUser();
      const agent = await createAuthenticatedAgent(app, user, testPassword);

      const response = await agent.post("/logout");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Déconnexion réussie");

      const setCookie = response.headers["set-cookie"];
      if (setCookie) {
        expect(setCookie[0]).toMatch(/token=;|token=deleted/);
      }
    });

    it("should return 401 without token", async () => {
      const response = await request(app).post("/logout");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Token manquant ou invalide");
    });
  });

  describe("GET /me", () => {
    it("should return current user data", async () => {
      const user = await createTestUser({ email: "me@test.com" });
      const agent = await createAuthenticatedAgent(app, user, testPassword);

      const response = await agent.get("/me");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(user._id.toString());
      expect(response.body.data.email).toBe("me@test.com");

      expect(response.body.data.password).toBeUndefined();
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/me");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Token manquant ou invalide");
    });

    it("should return 404 if user not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const token = generateToken(fakeId.toString(), "user");

      const response = await request(app)
        .get("/me")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Utilisateur introuvable");
    });

    it("should return 401 with expired token", async () => {
      const user = await createTestUser();

      const expiredToken = generateToken(user._id.toString(), user.role);

      const response = await request(app)
        .get("/me")
        .set("Cookie", "token=invalid.token.here");

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/Token/);
    });
  });
});
