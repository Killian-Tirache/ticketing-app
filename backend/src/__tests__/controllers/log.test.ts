import express from "express";
import cookieParser from "cookie-parser";
import { getLogs } from "../../controllers/logController";
import { login } from "../../controllers/authController";
import { Log } from "../../models/log.model";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { authorizeRolesMiddleware } from "../../middlewares/authorizeRolesMiddleware";
import { errorMiddleware } from "../../middlewares/errorMiddleware";
import {
  createTestAdmin,
  createAuthenticatedAgent,
} from "../helpers/testHelpers";
import { Types } from "mongoose";
import "../setup";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/login", login);
app.get("/logs", authMiddleware, authorizeRolesMiddleware("admin"), getLogs);
app.use(errorMiddleware);

describe("Log Controller", () => {
  let admin: any;
  let adminAgent: any;

  beforeEach(async () => {
    await Log.deleteMany({});

    admin = await createTestAdmin();
    adminAgent = await createAuthenticatedAgent(app, admin, "Test123!@#$%");
  });

  it("should return logs for admin", async () => {
    await Log.create({
      userId: admin._id,
      action: "create",
      entity: "Ticket",
      entityId: new Types.ObjectId(),
      success: true,
    });

    const response = await adminAgent.get("/logs");

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
