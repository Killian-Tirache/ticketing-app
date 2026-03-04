import { Router } from "express";
import { getMessages, createMessage } from "../controllers/messageController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/ticket/:id/messages", authMiddleware, getMessages);
router.post("/ticket/:id/messages", authMiddleware, createMessage);

export default router;
