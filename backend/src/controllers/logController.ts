import { NextFunction, Response } from "express";
import { Log } from "../models/log.model";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const getLogs = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const filters: any = {};
    const { action, entity, userId, success, search } = req.query;

    if (action) {
      const actions = (action as string).split(",").filter(Boolean);
      filters.action = actions.length === 1 ? actions[0] : { $in: actions };
    }

    if (entity) {
      const entities = (entity as string).split(",").filter(Boolean);
      filters.entity = entities.length === 1 ? entities[0] : { $in: entities };
    }

    if (userId) filters.userId = userId;
    if (success !== undefined) filters.success = success === "true";

    if (search) {
      const regex = new RegExp(search as string, "i");
      const parts = (search as string).trim().split(/\s+/);

      let userMatchFilter: any;
      if (parts.length >= 2) {
        const [first, ...rest] = parts;
        const last = rest.join(" ");
        userMatchFilter = {
          $or: [
            { firstName: regex },
            { lastName: regex },
            { email: regex },
            {
              $and: [
                { firstName: new RegExp(first, "i") },
                { lastName: new RegExp(last, "i") },
              ],
            },
            {
              $and: [
                { firstName: new RegExp(last, "i") },
                { lastName: new RegExp(first, "i") },
              ],
            },
          ],
        };
      } else {
        userMatchFilter = {
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
        };
      }

      const matchingUsers = await User.find(userMatchFilter).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      filters.$and = [
        ...(filters.$and ?? []),
        {
          $or: [
            { message: regex },
            ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
          ],
        },
      ];
    }

    const [logs, total] = await Promise.all([
      Log.find(filters)
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Log.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: logs,
    });
  },
);

export const getLogById = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const log = await Log.findById(id).populate(
      "userId",
      "firstName lastName email",
    );

    if (!log) {
      throw new AppError("Log introuvable", 404, "LOG_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  },
);

export const createLog = asyncHandler(
  async (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    const log = await Log.create(req.body);

    res.status(201).json({
      success: true,
      message: "Log créé avec succès",
      data: log,
    });
  },
);
