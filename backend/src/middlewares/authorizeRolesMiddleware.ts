import { Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";

export const authorizeRolesMiddleware = (roles: string | string[]) => {
  return (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return next(
        new AppError("Utilisateur non authentifié", 401, "AUTH_REQUIRED"),
      );
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.userRole)) {
      return next(
        new AppError("Accès refusé.", 403, "INSUFFICIENT_PERMISSIONS"),
      );
    }

    next();
  };
};
