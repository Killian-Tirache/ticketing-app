import { model, Schema } from "mongoose";
import { ITicket } from "../types/ticket.types";

const ticketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    type: {
      type: String,
      enum: ["bug", "feature", "support", "incident"],
      default: "support",
    },

    ticketNumber: {
      type: Number,
    },

    year: {
      type: Number,
      required: true,
      index: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

ticketSchema.index({ company: 1, year: 1, ticketNumber: 1 }, { unique: true });
ticketSchema.index({ company: 1, year: 1 });

ticketSchema.virtual("ticketRef").get(function () {
  if (this.populated("company") && typeof this.company === "object") {
    const prefix =
      (this.company as { ticketPrefix?: string }).ticketPrefix ?? "TICKET";
    const paddedNumber = String(this.ticketNumber).padStart(4, "0");
    return `${prefix}-${paddedNumber}-${this.year}`;
  }
  return `TICKET-${String(this.ticketNumber).padStart(4, "0")}-${this.year}`;
});

ticketSchema.set("toJSON", { virtuals: true });
ticketSchema.set("toObject", { virtuals: true });

export const Ticket = model<ITicket>("Ticket", ticketSchema);
