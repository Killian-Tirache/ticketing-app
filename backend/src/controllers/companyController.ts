import { NextFunction, Response } from "express";
import { Company } from "../models/company.model";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const getCompanies = asyncHandler(
  async (req: IRequestWithUserId, res: Response) => {
    const currentUser = await User.findById(req.userId).select(
      "role companies",
    );
    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }
    const filters: any = { isDeleted: false };

    if (currentUser.role !== "admin") {
      filters._id = { $in: currentUser.companies };
    }

    const { search } = req.query;

    if (search) {
      const regex = new RegExp(search as string, "i");
      filters.$and = [
        ...(filters.$and ?? []),
        { $or: [{ name: regex }, { ticketPrefix: regex }] },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      Company.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Company.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      count: companies.length,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      data: companies,
    });
  },
);

export const getCompanyById = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const company = await Company.findById(id);

    if (!company) {
      throw new AppError("Entreprise introuvable", 404, "COMPANY_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  },
);

export const createCompany = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { name, ticketPrefix } = req.body;

    const existingCompany = await Company.findOne({
      ticketPrefix: ticketPrefix.toUpperCase(),
    });

    if (existingCompany) {
      throw new AppError(
        `Le préfixe "${ticketPrefix}" est déjà utilisé`,
        400,
        "PREFIX_ALREADY_EXISTS",
      );
    }

    const company = await Company.create({
      name,
      ticketPrefix: ticketPrefix.toUpperCase(),
    });

    res.status(201).json({
      success: true,
      message: "Entreprise créée avec succès",
      data: company,
    });
  },
);

export const updateCompany = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, ticketPrefix, isDeleted } = req.body;

    const oldCompany = await Company.findById(id);
    if (!oldCompany) {
      throw new AppError("Entreprise introuvable", 404, "COMPANY_NOT_FOUND");
    }

    res.locals.oldData = oldCompany.toObject();

    if (ticketPrefix && ticketPrefix !== oldCompany.ticketPrefix) {
      const existingCompany = await Company.findOne({
        ticketPrefix: ticketPrefix.toUpperCase(),
        _id: { $ne: id },
      });

      if (existingCompany) {
        throw new AppError(
          `Le préfixe "${ticketPrefix}" est déjà utilisé`,
          400,
          "PREFIX_ALREADY_EXISTS",
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (ticketPrefix) updateData.ticketPrefix = ticketPrefix.toUpperCase();
    if (isDeleted !== undefined) updateData.isDeleted = isDeleted;

    const updatedCompany = await Company.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Entreprise mise à jour avec succès",
      data: updatedCompany,
    });
  },
);

export const deleteCompany = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const company = await Company.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );

    if (!company) {
      throw new AppError("Entreprise introuvable", 404, "COMPANY_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      message: "Entreprise supprimée avec succès",
      data: company,
    });
  },
);
