export interface Log {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action:
    | "create"
    | "update"
    | "delete"
    | "register"
    | "login"
    | "logout"
    | "error";
  entity: string;
  entityId?: string;
  success: boolean;
  message?: string;
  details?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LogFilters {
  search?: string;
  actions?: string[];
  entities?: string[];
  success?: boolean | null;
  page?: number;
  limit?: number;
}
