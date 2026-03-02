import { Response, NextFunction } from "express";
import { logAction } from "../utils/logAction";
import { AppError } from "../utils/AppError";
import { IRequestWithUserId } from "../types/global.types";
import { Types } from "mongoose";

export const autoLog = (
  action: "create" | "update" | "delete" | "register" | "login" | "logout",
  entity: string,
) => {
  return (req: IRequestWithUserId, res: Response, next: NextFunction) => {
    if (!["login", "register"].includes(action) && !req.userId) {
      return next(
        new AppError("Utilisateur non authentifié", 401, "AUTH_REQUIRED"),
      );
    }

    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      try {
        let responseData;
        try {
          responseData = typeof body === "string" ? JSON.parse(body) : body;
        } catch (error) {
          console.error("Erreur parsing response dans autoLog:", error);
          return originalSend(body);
        }

        if (action === "login" || action === "register") {
          const userId = responseData?.data?._id;
          if (userId) {
            logAction({
              userId,
              action,
              entity,
              entityId: userId,
              success: responseData.success ?? false,
              message: responseData.success
                ? `${action} ${entity} réussi`
                : responseData.error || "Action échouée",
              details: responseData.success
                ? responseData.data
                : { error: responseData.error },
            }).catch(console.error);
          }
        } else if (action === "update") {
          const oldData = res.locals.oldData;
          const newData = responseData?.data;
          const userId = req.userId;

          const changes: Record<string, { old: any; new: any }> = {};

          if (oldData && newData) {
            Object.keys(newData).forEach((key) => {
              if (["_id", "updatedAt", "createdAt", "__v"].includes(key))
                return;

              const newValue = newData[key];
              const oldValue = oldData[key];

              if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                changes[key] = { old: oldValue, new: newValue };
              }
            });
          }

          logAction({
            userId: new Types.ObjectId(userId),
            action,
            entity,
            entityId: newData?._id,
            success: responseData.success ?? false,
            message: responseData.success
              ? `${action} ${entity} réussi`
              : responseData.error || "Action échouée",
            details: changes,
          }).catch(console.error);
        } else {
          const userId = req.userId;
          logAction({
            userId: new Types.ObjectId(userId),
            action,
            entity,
            entityId: responseData.data?._id,
            success: responseData.success ?? false,
            message: responseData.success
              ? `${action} ${entity} réussi`
              : responseData.error || "Action échouée",
            details: responseData.success
              ? responseData.data
              : { error: responseData.error },
          }).catch(console.error);
        }
      } catch (err) {
        console.error("Erreur pendant autoLog :", err);
      }
      return originalSend(body);
    };
    next();
  };
};
