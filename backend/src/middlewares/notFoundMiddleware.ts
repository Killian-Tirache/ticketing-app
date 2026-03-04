import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const error = new AppError(
    `Route ${req.originalUrl} introuvable`,
    404,
    "NOT_FOUND",
  );
  next(error);
};
