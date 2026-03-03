import type { ApiResponse, PaginatedResponse } from "@/types/global.types";
import type { Log, LogFilters } from "@/types/log.types";
import api from "./api";

export const logService = {
  getAll: async (filters: LogFilters = {}): Promise<PaginatedResponse<Log>> => {
    const params = new URLSearchParams();
    if (filters.actions && filters.actions.length > 0)
      params.set("action", filters.actions.join(","));
    if (filters.entities && filters.entities.length > 0)
      params.set("entity", filters.entities.join(","));
    if (filters.success !== null && filters.success !== undefined)
      params.set("success", String(filters.success));
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const response = await api.get<PaginatedResponse<Log>>(
      `/logs?${params.toString()}`,
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Log>>(`/log/${id}`);
    return response.data.data;
  },
};
