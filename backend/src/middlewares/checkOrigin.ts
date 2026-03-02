import { Request, Response, NextFunction } from "express";

const allowedOrigin = process.env.FRONTEND_URL;

if (!allowedOrigin) {
  console.error("FRONTEND_URL is not defined in .env file");
  process.exit(1);
}

export const checkOrigin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const origin = req.headers.origin;

  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    if (!origin || !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({
        success: false,
        error: "Requête refusée : origine non autorisée.",
      });
    }
  }

  next();
};
