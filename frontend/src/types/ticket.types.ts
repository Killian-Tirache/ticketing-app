import type { Company } from "./company.types";
import type { User } from "./user.types";

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  company: Company;
  createdBy: User;
  assignedTo?: User | null;
  ticketNumber: number;
  year: number;
  ticketRef: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketFormData {
  _id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  company: string;
  createdBy: User;
  assignedTo?: string | null;
  ticketNumber: number;
  year: number;
  ticketRef: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
  company?: string;
  year?: number;
  page?: number;
  limit?: number;
}
