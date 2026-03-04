import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AppError } from "../utils/AppError";

export const validateObjectId = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = req.params[paramName];
    const id = Array.isArray(raw) ? raw[0] : raw;

    if (!Types.ObjectId.isValid(id)) {
      return next(
        new AppError(
          `ObjectId "${paramName}" invalide`,
          400,
          "INVALID_OBJECT_ID",
        ),
      );
    }

    next();
  };
};
