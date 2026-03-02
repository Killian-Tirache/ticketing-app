import { Counter } from "../models/counter.model";

export const getNextTicketNumberForCompany = async (
  companyId: string,
): Promise<{ ticketNumber: number; year: number }> => {
  const currentYear = new Date().getFullYear();
  const counterId = `ticket_company_${companyId}_${currentYear}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    {
      $inc: { sequence: 1 },
      $setOnInsert: { year: currentYear },
    },
    { new: true, upsert: true },
  );

  return {
    ticketNumber: counter.sequence,
    year: counter.year,
  };
};

export const getCurrentTicketNumber = async (
  companyId: string,
  year?: number,
): Promise<number> => {
  const targetYear = year || new Date().getFullYear();
  const counterId = `ticket_company_${companyId}_${targetYear}`;

  const counter = await Counter.findById(counterId);
  return counter?.sequence || 0;
};
