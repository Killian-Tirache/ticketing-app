import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;

export const userCreateSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(
      passwordRegex,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*)",
    ),
  role: z.enum(["admin", "support", "user"], {
    message: "Veuillez sélectionner un rôle",
  }),
  companies: z.array(z.string()),
});

export const userEditSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(
      passwordRegex,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*)",
    )
    .optional()
    .or(z.literal("")),
  role: z.enum(["admin", "support", "user"], {
    message: "Veuillez sélectionner un rôle",
  }),
  companies: z.array(z.string()),
});

export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserEditValues = z.infer<typeof userEditSchema>;
