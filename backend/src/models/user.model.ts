import { model, Schema } from "mongoose";
import { IUser } from "../types/user.types";
import { softDeleteFilter } from "../utils/softDeleteFilter";

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "support", "admin"],
      default: "user",
      required: true,
    },
    password: { type: String, required: true },
    companies: [{ type: Schema.Types.ObjectId, ref: "Company" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.plugin(softDeleteFilter);

export const User = model<IUser>("User", userSchema);
