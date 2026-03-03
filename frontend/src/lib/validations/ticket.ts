import { z } from "zod";

export const ticketFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  company: z.string().min(1, "Veuillez sélectionner une entreprise"),
  priority: z.enum(["low", "medium", "high", "critical"], {
    message: "Veuillez sélectionner une priorité",
  }),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
