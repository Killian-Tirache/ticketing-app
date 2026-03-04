import { Types } from "mongoose";

export interface ILog {
  userId: Types.ObjectId;
  action:
    | "create"
    | "update"
    | "delete"
    | "register"
    | "login"
    | "logout"
    | "error";
  entity: string;
  entityId?: Types.ObjectId;
  success: boolean;
  message?: string;
  details?: Record<string, any>;
}
