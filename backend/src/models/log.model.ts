import { model, Schema } from "mongoose";
import { ILog } from "../types/log.types";

const logSchema = new Schema<ILog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "register",
        "login",
        "logout",
        "error",
      ],
      required: true,
    },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: false },
    success: { type: Boolean, required: true },
    message: { type: String },
    details: { type: Object },
  },
  { timestamps: true },
);

export const Log = model<ILog>("Log", logSchema);
