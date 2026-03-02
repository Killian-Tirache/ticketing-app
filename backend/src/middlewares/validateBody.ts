import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../utils/AppError";

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      throw new AppError(
        "Données invalides",
        400,
        "VALIDATION_ERROR",
        error.details.map((detail) => detail.message),
      );
    }
    next();
  };
};
