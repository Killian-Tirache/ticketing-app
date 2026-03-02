import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getDashboard } from "../controllers/dashboardController";

const router = Router();
router.get("/dashboard", authMiddleware, getDashboard);
export default router;
