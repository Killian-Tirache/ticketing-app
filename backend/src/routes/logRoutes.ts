import express from "express";
import { createLogValidation } from "../validations/logValidation";
import { authMiddleware } from "../middlewares/authMiddleware";
import { authorizeRolesMiddleware } from "../middlewares/authorizeRolesMiddleware";
import { validateObjectId } from "../middlewares/validateObjectId";
import { validateBody } from "../middlewares/validateBody";
import { createLog, getLogById, getLogs } from "../controllers/logController";
const router = express.Router();

router.get("/logs", authMiddleware, authorizeRolesMiddleware("admin"), getLogs);
router.get(
  "/log/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  getLogById,
);
router.post(
  "/log",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(createLogValidation),
  createLog,
);

export default router;
