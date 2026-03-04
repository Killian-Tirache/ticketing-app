import { NextFunction, Response } from "express";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler";
import { Types } from "mongoose";
import { buildUserSearchFilter } from "../utils/buildUserSearchFilter";

export const getUsers = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const filters: any = { isDeleted: false };

    const { role, companies, search } = req.query;

    if (role) {
      const roles = (role as string).split(",").filter(Boolean);
      if (roles.length > 0) filters.role = { $in: roles };
    }

    if (companies) {
      const companyIds = (companies as string).split(",").filter(Boolean);
      if (companyIds.length > 0) {
        filters.companies = {
          $in: companyIds.map((id) => new Types.ObjectId(id)),
        };
      }
    }

    if (search) {
      const regex = new RegExp(search as string, "i");
      const userSearchFilter = await buildUserSearchFilter(search as string);
      filters.$and = [...(filters.$and ?? []), userSearchFilter];
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filters)
        .populate("companies", "name")
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      data: users,
    });
  },
);

export const getUserById = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const user = await User.findById(id)
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

export const createUser = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, password, role, companies } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("Cet email est déjà utilisé", 400, "EMAIL_EXISTS");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: passwordHash,
      role,
      companies: companies || [],
    });

    await user.populate("companies", "name");

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
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

export const updateUser = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { firstName, lastName, email, password, role, companies, isDeleted } =
      req.body;

    const oldUser = await User.findById(id).select("-password");
    if (!oldUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    res.locals.oldData = oldUser.toObject();

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (companies !== undefined) updateData.companies = companies;
    if (isDeleted !== undefined) updateData.isDeleted = isDeleted;

    if (password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("companies", "name")
      .select("-password");

    res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: updatedUser,
    });
  },
);

export const deleteUser = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    ).select("-password");

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès",
      data: user,
    });
  },
);

export const getAssignableUsers = asyncHandler(
  async (req: IRequestWithUserId, res: Response) => {
    const currentUser = await User.findById(req.userId).select("role companies");
    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    if (currentUser.role === "user") {
      throw new AppError("Accès refusé", 403, "INSUFFICIENT_PERMISSIONS");
    }

    if (currentUser.role === "support") {
      const me = await User.findById(req.userId).select("firstName lastName email role");
      return res.status(200).json({ success: true, data: me ? [me] : [] });
    }

    const { companyId } = req.query;
    if (!companyId) {
      throw new AppError("companyId requis", 400, "MISSING_PARAM");
    }

    const assignable = await User.find({
      isDeleted: false,
      $or: [
        { role: "admin" },
        { role: "support", companies: companyId },
      ],
    }).select("firstName lastName email role");

    res.status(200).json({ success: true, data: assignable });
  },
);