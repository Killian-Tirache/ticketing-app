export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "support" | "user";
  companies: Array<string | { _id: string; name: string }>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  search?: string;
  roles?: string[];
  companies?: string[];
  page?: number;
  limit?: number;
}
