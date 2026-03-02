import { Request, Response, NextFunction } from "express";
import { IRequestWithUserId } from "../types/global.types";

export const asyncHandler = (fn: Function) => {
  return (
    req: Request | IRequestWithUserId,
    res: Response,
    next: NextFunction,
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
