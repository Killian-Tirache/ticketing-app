import { Request, Response, NextFunction } from "express";

const allowedOrigin = process.env.FRONTEND_URL;

if (!allowedOrigin && process.env.NODE_ENV !== 'test') {
  console.error("FRONTEND_URL is not defined in .env file");
  process.exit(1);
}

export const checkOrigin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === 'test') return next();
  
  const origin = req.headers.origin;

  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    if (!origin || !allowedOrigin || !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({
        success: false,
        error: "Requête refusée : origine non autorisée.",
      });
    }
  }

  next();
};
