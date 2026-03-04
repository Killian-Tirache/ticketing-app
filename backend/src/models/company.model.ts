import { model, Schema } from "mongoose";
import { ICompany } from "../types/company.types";
import { softDeleteFilter } from "../utils/softDeleteFilter";

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, unique: true },
    ticketPrefix: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

companySchema.plugin(softDeleteFilter);

export const Company = model<ICompany>("Company", companySchema);
