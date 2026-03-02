import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/AppError";
import { IRequestWithUserId } from "../../types/global.types";
import { generateToken } from "../helpers/testHelpers";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token: string | undefined;

    if (process.env.NODE_ENV === "test" && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return next(new AppError("Token manquant ou invalide", 401, "NO_TOKEN"));
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next(
        new AppError("Configuration serveur incorrecte", 500, "NO_JWT_SECRET"),
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };

    (req as IRequestWithUserId).userId = decoded.id;
    (req as IRequestWithUserId).userRole = decoded.role;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expiré", 401, "TOKEN_EXPIRED"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Token invalide", 401, "INVALID_TOKEN"));
    }
    next(error);
  }
};

describe("Auth Middleware", () => {
  it("should extract userId from valid token", async () => {
    const mockReq = {
      headers: {
        authorization: `Bearer ${generateToken("123456789012345678901234", "admin")}`,
      },
      cookies: {},
    } as any;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    await authMiddleware(mockReq, mockRes, mockNext);

    expect(mockReq.userId).toBe("123456789012345678901234");
    expect(mockReq.userRole).toBe("admin");
    expect(mockNext).toHaveBeenCalledWith();
  });
});
