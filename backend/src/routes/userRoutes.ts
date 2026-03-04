import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateObjectId } from "../middlewares/validateObjectId";
import { authorizeRolesMiddleware } from "../middlewares/authorizeRolesMiddleware";
import { validateBody } from "../middlewares/validateBody";
import { autoLog } from "../middlewares/autoLog";
import {
  createUserValidation,
  updateUserValidation,
} from "../validations/userValidations";
import { loginValidation } from "../validations/authValidations";
import { authLimiter } from "../utils/limiter";
import { getMe, login, logout } from "../controllers/authController";
import {
  createUser,
  deleteUser,
  getAssignableUsers,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController";

const router = express.Router();

router.get("/user/me", authMiddleware, getMe);
router.get("/users/assignable", authMiddleware, getAssignableUsers);
router.get(
  "/users",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  getUsers,
);
router.get(
  "/user/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  getUserById,
);
router.post(
  "/user",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(createUserValidation),
  autoLog("create", "User"),
  createUser,
);
router.put(
  "/user/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  validateBody(updateUserValidation),
  autoLog("update", "User"),
  updateUser,
);
router.delete(
  "/user/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  autoLog("delete", "User"),
  deleteUser,
);

router.post(
  "/user/login",
  authLimiter,
  validateBody(loginValidation),
  autoLog("login", "User"),
  login,
);
router.post("/user/logout", authMiddleware, autoLog("logout", "User"), logout);

export default router;
