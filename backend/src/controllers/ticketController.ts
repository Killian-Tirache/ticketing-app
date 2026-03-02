import { NextFunction, Response } from "express";
import { Ticket } from "../models/ticket.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { parseTicketRef } from "../utils/formatTicketRef";
import { Company } from "../models/company.model";
import { getNextTicketNumberForCompany } from "../utils/getNextTicketNumber";
import { getIO } from "../socket";

export const getTickets = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    const filters: any = {};

    if (currentUser.role !== "admin") {
      if (!currentUser.companies || currentUser.companies.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          page: 1,
          data: [],
        });
      }
      filters.company = { $in: currentUser.companies };
    }

    const { status, priority, type, company, year, search } = req.query;

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (type) filters.type = type;
    if (year) filters.year = parseInt(year as string, 10);

    if (company && company !== "all") {
      if (currentUser.role === "admin") {
        filters.company = new Types.ObjectId(company as string);
      } else {
        const isAuthorized = currentUser.companies?.some(
          (c) => c.toString() === (company as string),
        );
        if (isAuthorized) {
          filters.company = new Types.ObjectId(company as string);
        }
      }
    }

    if (search) {
      const trimmed = (search as string).trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchConditions: any[] = [
        { title: { $regex: escaped, $options: "i" } },
      ];

      const upper = trimmed.toUpperCase();

      const allCompanies = (await Company.find(
        {},
        "ticketPrefix _id",
      )) as Array<{ _id: any; ticketPrefix: string }>;

      const matchedCompany = allCompanies.find((c) =>
        upper.startsWith(c.ticketPrefix.toUpperCase()),
      );

      if (matchedCompany) {
        const rest = upper
          .slice(matchedCompany.ticketPrefix.length)
          .replace(/^-/, "");
        const restParts = rest.split("-");

        const companyCondition: any = {
          company: matchedCompany._id,
        };

        if (restParts[0]) {
          const ticketNumber = parseInt(restParts[0], 10);
          if (!isNaN(ticketNumber)) {
            companyCondition.ticketNumber = ticketNumber;
          }
        }

        if (restParts[1]) {
          const year = parseInt(restParts[1], 10);
          if (!isNaN(year)) {
            companyCondition.year = year;
          }
        }

        searchConditions.push(companyCondition);
      }

      const asNumber = parseInt(trimmed, 10);
      if (!isNaN(asNumber) && String(asNumber) === trimmed) {
        searchConditions.push({ ticketNumber: asNumber });
      }

      filters.$and = [...(filters.$and ?? []), { $or: searchConditions }];
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filters)
        .populate("company", "name ticketPrefix")
        .populate("createdBy", "firstName lastName email")
        .populate("assignedTo", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      data: tickets,
    });
  },
);

export const getTicketById = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    const ticket = await Ticket.findById(id)
      .populate("company", "name ticketPrefix")
      .populate("createdBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!ticket) {
      throw new AppError("Ticket introuvable", 404, "TICKET_NOT_FOUND");
    }

    if (currentUser.role !== "admin") {
      const hasAccess = currentUser.companies?.some(
        (companyId) => companyId.toString() === ticket.company._id.toString(),
      );

      if (!hasAccess) {
        throw new AppError(
          "Accès refusé à ce ticket",
          403,
          "INSUFFICIENT_PERMISSIONS",
        );
      }
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  },
);

export const getTicketByRef = async (
  req: IRequestWithUserId,
  res: Response,
) => {
  const { ref } = req.params;
  const rawRef = Array.isArray(ref) ? ref[0] : ref;
  const currentUser = await User.findById(req.userId);

  if (!currentUser) {
    throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
  }

  const parsed = parseTicketRef(rawRef.toUpperCase());
  if (!parsed) {
    throw new AppError(
      "Format de référence invalide (attendu: PREFIX-XXXX-YYYY)",
      400,
      "INVALID_REF_FORMAT",
    );
  }

  const { prefix, number, year } = parsed;

  const company = await Company.findOne({ ticketPrefix: prefix });
  if (!company) {
    throw new AppError(
      `Aucune entreprise avec le préfixe "${prefix}"`,
      404,
      "COMPANY_NOT_FOUND",
    );
  }

  const ticket = await Ticket.findOne({
    company: company._id,
    year,
    ticketNumber: number,
  })
    .populate("company", "name ticketPrefix")
    .populate("createdBy", "firstName lastName email")
    .populate("assignedTo", "firstName lastName email");

  if (!ticket) {
    throw new AppError(
      `Ticket "${rawRef}" introuvable`,
      404,
      "TICKET_NOT_FOUND",
    );
  }

  if (currentUser.role !== "admin") {
    const hasAccess = currentUser.companies?.some(
      (companyId) => companyId.toString() === company._id.toString(),
    );

    if (!hasAccess) {
      throw new AppError(
        "Accès refusé à ce ticket",
        403,
        "INSUFFICIENT_PERMISSIONS",
      );
    }
  }

  res.status(200).json({
    success: true,
    data: ticket,
  });
};

export const createTicket = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { title, description, priority, type, company, assignedTo } =
      req.body;
    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    if (currentUser.role !== "admin") {
      const hasAccess = currentUser.companies?.some(
        (companyId) => companyId.toString() === company,
      );

      if (!hasAccess) {
        throw new AppError(
          "Vous ne pouvez pas créer de ticket pour cette entreprise",
          403,
          "INSUFFICIENT_PERMISSIONS",
        );
      }
    }

    const { ticketNumber, year } = await getNextTicketNumberForCompany(company);

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || "medium",
      type: type || "support",
      status: "open",
      ticketNumber,
      year,
      company,
      createdBy: req.userId,
      assignedTo: assignedTo || null,
    });

    await ticket.populate("company", "name ticketPrefix");
    await ticket.populate("createdBy", "firstName lastName email");
    if (ticket.assignedTo) {
      await ticket.populate("assignedTo", "firstName lastName email");
    }

    const io = getIO();
    const companyId = (ticket.company as any)._id.toString();
    io.to("role:admin").emit("ticket:created", ticket);
    io.to(`company:${companyId}`).emit("ticket:created", ticket);

    res.status(201).json({
      success: true,
      message: "Ticket créé avec succès",
      data: ticket,
    });
  },
);

export const updateTicket = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { title, description, status, priority, type, assignedTo } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    const oldTicket = await Ticket.findById(id);
    if (!oldTicket) {
      throw new AppError("Ticket introuvable", 404, "TICKET_NOT_FOUND");
    }

    if (currentUser.role !== "admin") {
      const hasAccess = currentUser.companies?.some(
        (companyId) => companyId.toString() === oldTicket.company.toString(),
      );
      if (!hasAccess) {
        throw new AppError("Accès refusé à ce ticket", 403, "INSUFFICIENT_PERMISSIONS");
      }
    }

    if (assignedTo !== undefined && assignedTo !== null && assignedTo !== "") {
      const targetUser = await User.findById(assignedTo).select("role companies");

      if (!targetUser) {
        throw new AppError("Utilisateur à assigner introuvable", 404, "USER_NOT_FOUND");
      }

      if (currentUser.role === "support") {
        if (assignedTo.toString() !== currentUser._id.toString()) {
          throw new AppError(
            "Vous ne pouvez assigner ce ticket qu'à vous-même",
            403,
            "INSUFFICIENT_PERMISSIONS",
          );
        }
      } else if (currentUser.role === "admin") {
        if (targetUser.role === "user") {
          throw new AppError(
            "Impossible d'assigner un ticket à un utilisateur avec le rôle 'user'",
            403,
            "INVALID_ASSIGNEE_ROLE",
          );
        }
        if (targetUser.role === "support") {
          const companyId = oldTicket.company.toString();
          const managesCompany = targetUser.companies?.some(
            (c) => c.toString() === companyId,
          );
          if (!managesCompany) {
            throw new AppError(
              "Cet utilisateur support ne gère pas l'entreprise de ce ticket",
              403,
              "ASSIGNEE_COMPANY_MISMATCH",
            );
          }
        }
      }
    }

    res.locals.oldData = oldTicket.toObject();

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (type) updateData.type = type;
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo === "" || assignedTo === null ? null : assignedTo;
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("company", "name ticketPrefix")
      .populate("createdBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Ticket mis à jour avec succès",
      data: updatedTicket,
    });
  },
);


export const deleteTicket = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new AppError("Ticket introuvable", 404, "TICKET_NOT_FOUND");
    }

    if (currentUser.role !== "admin") {
      throw new AppError(
        "Seul un administrateur peut supprimer des tickets",
        403,
        "INSUFFICIENT_PERMISSIONS",
      );
    }

    await Ticket.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Ticket supprimé avec succès",
    });
  },
);
