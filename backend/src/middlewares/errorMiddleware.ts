import { NextFunction, Response } from "express";
import { IRequestWithUserId } from "../types/global.types";
import { logAction } from "../utils/logAction";
import { Types } from "mongoose";

export const errorMiddleware = (
  err: any,
  req: IRequestWithUserId,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    return;
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  const details = err.details || [];
  const fieldLabels: Record<string, string> = {
    name: "nom",
    companyName: "nom de société",
  };

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || {})[0] || "champ";
    const fieldLabel = fieldLabels[field] || field;
    message = `Une entrée avec ce ${fieldLabel} existe déjà.`;
  }

  if (req.userId) {
    logAction({
      userId: new Types.ObjectId(req.userId),
      action: "error",
      entity: "System",
      entityId: new Types.ObjectId(req.userId),
      success: false,
      message,
      details: {
        stack: err.stack,
        route: req.originalUrl,
        method: req.method,
        body: req.body,
      },
    }).catch(console.error);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    details: details,
  });
};
