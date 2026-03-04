import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateObjectId } from "../middlewares/validateObjectId";
import { authorizeRolesMiddleware } from "../middlewares/authorizeRolesMiddleware";
import { validateBody } from "../middlewares/validateBody";
import { autoLog } from "../middlewares/autoLog";
import {
  createCompanyValidation,
  updateCompanyValidation,
} from "../validations/companyValidations";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
} from "../controllers/companyController";

const router = express.Router();

router.get("/companies", authMiddleware, getCompanies);
router.get("/company/:id", authMiddleware, validateObjectId(), getCompanyById);
router.post(
  "/company",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateBody(createCompanyValidation),
  autoLog("create", "Company"),
  createCompany,
);
router.put(
  "/company/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  validateBody(updateCompanyValidation),
  autoLog("update", "Company"),
  updateCompany,
);
router.delete(
  "/company/:id",
  authMiddleware,
  authorizeRolesMiddleware("admin"),
  validateObjectId(),
  autoLog("delete", "Company"),
  deleteCompany,
);

export default router;
