import { Types } from "mongoose";

export interface ITicket {
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  type: "bug" | "feature" | "support" | "incident";
  ticketNumber?: number;
  year: number;
  company: Types.ObjectId;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
}
