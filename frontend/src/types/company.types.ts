export interface Company {
  _id: string;
  name: string;
  ticketPrefix: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFilters {
  search?: string;
  page?: number;
  limit?: number;
}
