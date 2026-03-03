import type {
  Ticket,
  TicketFilters,
  TicketFormData,
} from "@/types/ticket.types";
import type { ApiResponse, PaginatedResponse } from "@/types/global.types";
import api from "./api";

export const ticketService = {
  getAll: async (
    filters: TicketFilters = {},
  ): Promise<PaginatedResponse<Ticket>> => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status && filters.status !== "all")
      params.set("status", filters.status);
    if (filters.priority && filters.priority !== "all")
      params.set("priority", filters.priority);
    if (filters.type && filters.type !== "all")
      params.set("type", filters.type);
    if (filters.company && filters.company !== "all")
      params.set("company", filters.company);
    if (filters.year) params.set("year", String(filters.year));
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const { data } = await api.get<PaginatedResponse<Ticket>>(
      `/tickets?${params.toString()}`,
    );
    return data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Ticket>>(`/ticket/${id}`);
    return response.data.data;
  },

  getByRef: async (ref: string) => {
    const response = await api.get<ApiResponse<Ticket>>(`/ticket/ref/${ref}`);
    return response.data.data;
  },

  create: async (data: Partial<TicketFormData>) => {
    const response = await api.post<ApiResponse<Ticket>>("/ticket", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<TicketFormData>) => {
    const response = await api.put<ApiResponse<Ticket>>(`/ticket/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/ticket/${id}`);
    return response.data;
  },
};
