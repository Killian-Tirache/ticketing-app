import Joi from "joi";

export const createCompanyValidation = Joi.object({
  name: Joi.string().required(),
  ticketPrefix: Joi.string()
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .min(2)
    .max(10)
    .required()
    .messages({
      "string.pattern.base":
        "Le préfixe doit contenir uniquement des lettres majuscules et chiffres",
      "string.min": "Le préfixe doit contenir au moins 2 caractères",
      "string.max": "Le préfixe doit contenir au maximum 10 caractères",
      "any.required": "Le préfixe est requis",
    }),
  isDeleted: Joi.boolean().optional().default(false),
});

export const updateCompanyValidation = Joi.object({
  name: Joi.string().optional(),
  ticketPrefix: Joi.string()
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .min(2)
    .max(10)
    .optional()
    .messages({
      "string.pattern.base":
        "Le préfixe doit contenir uniquement des lettres majuscules et chiffres",
      "string.min": "Le préfixe doit contenir au moins 2 caractères",
      "string.max": "Le préfixe doit contenir au maximum 10 caractères",
    }),
  isDeleted: Joi.boolean().optional(),
});
