import { Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import jwt from "jsonwebtoken";
import { IRequestWithUserId } from "../types/global.types";
import { asyncHandler } from "../utils/asyncHandler";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authMiddleware = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) {
      throw new AppError("Token manquant ou invalide", 401, "TOKEN_MISSING");
    }

    try {
      const decodedToken = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: string;
      };
      req.userId = decodedToken.id;
      req.userRole = decodedToken.role;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Token expiré", 401, "TOKEN_EXPIRED");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Token invalide", 401, "TOKEN_INVALID");
      } else {
        throw new AppError("Authentification échouée", 401, "AUTH_FAILED");
      }
    }
  },
);
