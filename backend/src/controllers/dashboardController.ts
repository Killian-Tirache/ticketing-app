import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Ticket } from "../models/ticket.model";
import { User } from "../models/user.model";
import { Company } from "../models/company.model";
import { IRequestWithUserId } from "../types/global.types";
import { AppError } from "../utils/AppError";

export const getDashboard = asyncHandler(
  async (req: IRequestWithUserId, res: Response) => {
    const currentUser = await User.findById(req.userId).select(
      "role companies firstName lastName",
    );
    if (!currentUser)
      throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");

    const { role, companies } = currentUser;

    if (role === "admin") {
      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        totalUsers,
        totalCompanies,
        recentTickets,
      ] = await Promise.all([
        Ticket.countDocuments({}),
        Ticket.countDocuments({ status: "open" }),
        Ticket.countDocuments({ status: "in_progress" }),
        Ticket.countDocuments({ status: "resolved" }),
        Ticket.countDocuments({ status: "closed" }),
        User.countDocuments({ isDeleted: false }),
        Company.countDocuments({ isDeleted: false }),
        Ticket.find({})
          .populate("company", "name ticketPrefix")
          .populate("createdBy", "firstName lastName")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            closedTickets,
            totalUsers,
            totalCompanies,
          },
          recentTickets,
        },
      });
    }

    if (role === "support") {
      const companyFilter = { company: { $in: companies } };
      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        assignedToMe,
        recentTickets,
      ] = await Promise.all([
        Ticket.countDocuments(companyFilter),
        Ticket.countDocuments({ ...companyFilter, status: "open" }),
        Ticket.countDocuments({ ...companyFilter, status: "in_progress" }),
        Ticket.countDocuments({ ...companyFilter, status: "resolved" }),
        Ticket.countDocuments({ ...companyFilter, assignedTo: req.userId }),
        Ticket.find(companyFilter)
          .populate("company", "name ticketPrefix")
          .populate("createdBy", "firstName lastName")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            assignedToMe,
          },
          recentTickets,
        },
      });
    }

    // role === "user"
    const userFilter = { company: { $in: companies } };
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets,
    ] = await Promise.all([
      Ticket.countDocuments(userFilter),
      Ticket.countDocuments({ ...userFilter, status: "open" }),
      Ticket.countDocuments({ ...userFilter, status: "in_progress" }),
      Ticket.countDocuments({ ...userFilter, status: "resolved" }),
      Ticket.find(userFilter)
        .populate("company", "name ticketPrefix")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
        },
        recentTickets,
      },
    });
  },
);
