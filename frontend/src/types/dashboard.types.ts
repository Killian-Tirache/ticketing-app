import type { Ticket } from "./ticket.types";

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets?: number;
  totalUsers?: number;
  totalCompanies?: number;
  assignedToMe?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentTickets: Ticket[];
}
