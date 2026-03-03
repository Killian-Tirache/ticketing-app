export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  page: number;
  data: T[];
}
