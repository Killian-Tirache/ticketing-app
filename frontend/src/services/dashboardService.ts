import api from "./api";
import type { DashboardData } from "@/types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const dashboardService = {
  get: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>("/dashboard");
    return response.data.data;
  },
};
