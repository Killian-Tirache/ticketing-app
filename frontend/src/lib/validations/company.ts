import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  ticketPrefix: z
    .string()
    .min(2, "Le préfixe doit contenir au moins 2 caractères")
    .max(10, "Le préfixe doit contenir au maximum 10 caractères")
    .transform((v) => v.toUpperCase().trim()),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
