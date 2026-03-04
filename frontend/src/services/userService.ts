import type { ApiResponse, PaginatedResponse } from "@/types/global.types";
import type { User, UserFilters } from "@/types/user.types";
import api from "./api";

export const userService = {
  getAll: async (
    filters: UserFilters = {},
  ): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.roles && filters.roles.length > 0)
      params.set("role", filters.roles.join(","));
    if (filters.companies && filters.companies.length > 0)
      params.set("companies", filters.companies.join(","));
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const response = await api.get<PaginatedResponse<User>>(
      `/users?${params.toString()}`,
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<User>>(`/user/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<User> & { password: string }) => {
    const response = await api.post<ApiResponse<User>>("/user", data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>(`/user/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/user/${id}`);
    return response.data;
  },

  getAssignableForTicket: async (companyId: string): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("/users/assignable", {
      params: { companyId },
    });
    return response.data.data;
  },
};
