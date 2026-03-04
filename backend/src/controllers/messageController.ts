import { Response } from "express";
import { Message } from "../models/message.model";
import { Ticket } from "../models/ticket.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { getIO } from "../socket";
import { IRequestWithUserId } from "../types/global.types";
import { Types } from "mongoose";

const checkTicketAccess = async (ticketId: string, userId: string) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new AppError("Ticket introuvable", 404, "TICKET_NOT_FOUND");

  const user = await User.findById(userId).select("role companies");
  if (!user) throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");

  if (user.role === "admin") return ticket;

  const hasAccess = user.companies?.some(
    (c) => c.toString() === ticket.company.toString(),
  );
  if (!hasAccess) throw new AppError("Accès refusé", 403, "INSUFFICIENT_PERMISSIONS");

  return ticket;
};

export const getMessages = asyncHandler(
  async (req: IRequestWithUserId, res: Response) => {
    const ticketId = req.params.id as string;

    await checkTicketAccess(ticketId, req.userId!);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ ticket: new Types.ObjectId(ticketId) })
        .populate("author", "firstName lastName role")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ ticket: new Types.ObjectId(ticketId) }),
    ]);

    res.status(200).json({
      success: true,
      data: messages,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  },
);

export const createMessage = asyncHandler(
  async (req: IRequestWithUserId, res: Response) => {
    const ticketId = req.params.id as string;
    const { content } = req.body;

    if (!content?.trim()) {
      throw new AppError(
        "Le message ne peut pas être vide",
        400,
        "EMPTY_MESSAGE",
      );
    }

    await checkTicketAccess(ticketId, req.userId!);

    const message = await Message.create({
      ticket: new Types.ObjectId(ticketId),
      author: new Types.ObjectId(req.userId!),
      content: content.trim(),
    });

    await message.populate("author", "firstName lastName role");
    const ticket = await Ticket.findById(ticketId).select("company");

    const io = getIO();
    io.to(`ticket:${ticketId}`).emit("message:created", message);
    io.to("role:admin").emit("message:created", message);
    io.to(`company:${ticket!.company.toString()}`).emit("message:created", message);

    res.status(201).json({ success: true, data: message });
  },
);
