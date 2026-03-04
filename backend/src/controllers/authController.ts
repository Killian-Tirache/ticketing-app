import { NextFunction, Response } from "express";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ??
  "7d") as SignOptions["expiresIn"];
const NODE_ENV = process.env.NODE_ENV || "development";

const sendTokenResponse = (userId: string, role: string, res: Response) => {
  const token = jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "none" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, cookieOptions);
  return token;
};

export const login = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError(
        "Email ou mot de passe incorrect",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Email ou mot de passe incorrect",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    sendTokenResponse(user._id.toString(), user.role, res);

    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companies: user.companies,
      },
    });
  },
);

export const logout = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });
  },
);

export const getMe = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const user = await User.findById(req.userId)
      .populate("companies", "name")
      .select("-password");

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  },
);
