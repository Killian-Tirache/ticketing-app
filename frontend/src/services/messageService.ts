import type { ApiResponse, PaginatedResponse } from "@/types/global.types";
import api from "./api";
import type { Message } from "@/types/message.types";

export const messageService = {
  getAll: async (
    ticketId: string,
    page = 1,
    limit = 30,
  ): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>(
      `/ticket/${ticketId}/messages`,
      { params: { page, limit } },
    );
    return {
      data: response.data.data,
      total: response.data.total ?? 0,
      totalPages: response.data.totalPages ?? 1,
      page: response.data.page ?? 1,
      count: response.data.count ?? response.data.data.length,
      success: response.data.success,
    };
  },

  create: async (ticketId: string, content: string): Promise<Message> => {
    const response = await api.post<ApiResponse<Message>>(
      `/ticket/${ticketId}/messages`,
      { content },
    );
    return response.data.data;
  },
};
