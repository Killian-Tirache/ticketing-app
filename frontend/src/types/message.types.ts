import type { User } from "./user.types";

export interface Message {
  _id: string;
  ticket: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMessages {
  data: Message[];
  total: number;
  totalPages: number;
  page: number;
}
