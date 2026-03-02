import { Company } from "../models/company.model";

export const formatTicketRef = async (
  ticketNumber: number,
  year: number,
  companyId: string,
): Promise<string> => {
  const company = await Company.findById(companyId);

  if (!company) {
    return `TICKET-${String(ticketNumber).padStart(4, "0")}-${year}`;
  }

  const prefix = company.ticketPrefix;
  const paddedNumber = String(ticketNumber).padStart(4, "0");

  return `${prefix}-${paddedNumber}-${year}`;
};

export const parseTicketRef = (
  ref: string,
): { prefix: string; number: number; year: number } | null => {
  const match = ref.match(/^([A-Z0-9]+)-(\d+)-(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, prefix, numberStr, yearStr] = match;
  const number = parseInt(numberStr, 10);
  const year = parseInt(yearStr, 10);

  if (year < 2020 || year > 2100) {
    return null;
  }

  return { prefix, number, year };
};
