import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractCompanyIds(
  companies: Array<string | { _id: string; name: string }>,
): string[] {
  if (!companies) return [];
  return companies.map((c) => (typeof c === "string" ? c : c._id));
}
