import "../setup";
import express from "express";
import cookieParser from "cookie-parser";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../../controllers/userController";
import { login } from "../../controllers/authController";
import { User } from "../../models/user.model";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { authorizeRolesMiddleware } from "../../middlewares/authorizeRolesMiddleware";
import { errorMiddleware } from "../../middlewares/errorMiddleware";
import { validateBody } from "../../middlewares/validateBody";
import {
  createUserValidation,
  updateUserValidation,
} from "../../validations/userValidations";
import {
  createTestAdmin,
  createTestUser,
  createTestSupport,
  createAuthenticatedAgent,
} from "../helpers/testHelpers";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/login", login);
app.get("/users", authMiddleware, authorizeRolesMiddleware("admin"), getUsers);
app.get(
  "/user/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  getUserById,
);
app.post(
  "/user",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(createUserValidation),
  createUser,
);
app.put(
  "/user/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(updateUserValidation),
  updateUser,
);
app.delete(
  "/user/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  deleteUser,
);
app.use(errorMiddleware);

describe("User Controller", () => {
  let admin: any;
  let adminAgent: any;
  let support: any;
  let supportAgent: any;
  const testPassword = "Test123!@#$%";

  beforeEach(async () => {
    admin = await createTestAdmin();
    adminAgent = await createAuthenticatedAgent(app, admin, testPassword);

    support = await createTestSupport();
    supportAgent = await createAuthenticatedAgent(app, support, testPassword);
  });

  describe("GET /users", () => {
    it("should return all users for admin", async () => {
      await createTestUser({ email: "user1@test.com" });
      await createTestUser({ email: "user2@test.com" });

      const response = await adminAgent.get("/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it("should return 403 for non-admin", async () => {
      const response = await supportAgent.get("/users");

      expect(response.status).toBe(403);
    });

    it("should not return deleted users", async () => {
      await createTestUser({ email: "active@test.com" });
      await createTestUser({ email: "deleted@test.com", isDeleted: true });

      const response = await adminAgent.get("/users");

      expect(response.status).toBe(200);
      expect(response.body.data.every((u: any) => !u.isDeleted)).toBe(true);
    });
  });

  describe("GET /user/:id", () => {
    it("should return user by id for admin", async () => {
      const user = await createTestUser({ email: "test@test.com" });

      const response = await adminAgent.get(`/user/${user._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(user._id.toString());
      expect(response.body.data.email).toBe("test@test.com");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await adminAgent.get(`/user/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it("should return 403 for non-admin", async () => {
      const user = await createTestUser();

      const response = await supportAgent.get(`/user/${user._id}`);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /user", () => {
    it("should create a new user as admin", async () => {
      const response = await adminAgent.post("/user").send({
        firstName: "New",
        lastName: "User",
        email: "newuser@test.com",
        password: "Password123!",
        role: "user",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("newuser@test.com");
    });

    it("should return 400 if email already exists", async () => {
      await createTestUser({ email: "duplicate@test.com" });

      const response = await adminAgent.post("/user").send({
        firstName: "Test",
        lastName: "User",
        email: "duplicate@test.com",
        password: "Password123!",
        role: "user",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("déjà utilisé");
    });

    it("should return 403 for non-admin", async () => {
      const response = await supportAgent.post("/user").send({
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        password: "Password123!",
        role: "user",
      });

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /user/:id", () => {
    it("should update user as admin", async () => {
      const user = await createTestUser({ email: "before@test.com" });

      const response = await adminAgent
        .put(`/user/${user._id}`)
        .send({ email: "after@test.com" });

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe("after@test.com");
    });

    it("should hash password when updating", async () => {
      const user = await createTestUser();

      const response = await adminAgent
        .put(`/user/${user._id}`)
        .send({ password: "NewPassword123!" });

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.password).not.toBe("NewPassword123!");
      expect(updatedUser?.password.startsWith("$2")).toBe(true);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await adminAgent
        .put(`/user/${fakeId}`)
        .send({ firstName: "Updated" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /user/:id", () => {
    it("should soft delete user as admin", async () => {
      const user = await createTestUser({ email: "delete@test.com" });

      const response = await adminAgent.delete(`/user/${user._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedUser = await User.findOne({
        _id: user._id,
        isDeleted: true,
      });
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.isDeleted).toBe(true);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await adminAgent.delete(`/user/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });
});
