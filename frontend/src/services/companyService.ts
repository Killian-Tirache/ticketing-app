import type { ApiResponse, PaginatedResponse } from "@/types/global.types";
import type { Company, CompanyFilters } from "@/types/company.types";
import api from "./api";

export const companyService = {
  getAll: async (
    filters: CompanyFilters = {},
  ): Promise<PaginatedResponse<Company>> => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const response = await api.get<PaginatedResponse<Company>>(
      `/companies?${params.toString()}`,
    );
    return response.data;
  },

  getAllForSelect: async (): Promise<Company[]> => {
    const response = await api.get<{ data: Company[] }>(
      "/companies?limit=1000",
    );
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Company>>(`/company/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Company>) => {
    const response = await api.post<ApiResponse<Company>>("/company", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Company>) => {
    const response = await api.put<ApiResponse<Company>>(
      `/company/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/company/${id}`);
    return response.data;
  },
};
