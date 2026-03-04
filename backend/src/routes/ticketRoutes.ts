import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateObjectId } from "../middlewares/validateObjectId";
import { validateBody } from "../middlewares/validateBody";
import { autoLog } from "../middlewares/autoLog";
import {
  createTicketValidation,
  updateTicketValidation,
} from "../validations/ticketValidations";
import { authorizeRolesMiddleware } from "../middlewares/authorizeRolesMiddleware";
import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTicketByRef,
  getTickets,
  updateTicket,
} from "../controllers/ticketController";

const router = express.Router();

router.get("/tickets", authMiddleware, getTickets);
router.get("/ticket/ref/:ref", authMiddleware, getTicketByRef);
router.get("/ticket/:id", authMiddleware, validateObjectId(), getTicketById);
router.post(
  "/ticket",
  authMiddleware,
  validateBody(createTicketValidation),
  autoLog("create", "Ticket"),
  createTicket,
);
router.put(
  "/ticket/:id",
  authMiddleware,
  authorizeRolesMiddleware(["admin", "support"]),
  validateObjectId(),
  validateBody(updateTicketValidation),
  autoLog("update", "Ticket"),
  updateTicket,
);
router.delete(
  "/ticket/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  autoLog("delete", "Ticket"),
  deleteTicket,
);

export default router;
