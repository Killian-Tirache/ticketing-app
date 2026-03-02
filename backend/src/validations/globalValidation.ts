import Joi from "joi";

export const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

export const passwordPattern = Joi.string()
  .min(12)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
  .messages({
    "string.min": "Le mot de passe doit contenir au moins 12 caractères",
    "string.pattern.base":
      "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*)",
    "string.empty": "Le mot de passe est requis",
  });
