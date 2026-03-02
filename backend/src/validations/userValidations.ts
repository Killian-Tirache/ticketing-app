import Joi from "joi";
import { objectId, passwordPattern } from "./globalValidation";

export const createUserValidation = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid("user", "support", "admin").required(),
  email: Joi.string().email().required().messages({
    "string.email": "L'email doit être une adresse valide",
  }),
  password: passwordPattern.required(),
  companies: Joi.array().items(objectId).optional(),
});

export const updateUserValidation = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  role: Joi.string().valid("user", "support", "admin").optional(),
  email: Joi.string().email().optional().messages({
    "string.email": "L'email doit être une adresse valide",
  }),
  password: passwordPattern.optional(),
  companies: Joi.array().items(objectId).optional(),
  isDeleted: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Au moins un champ doit être renseigné pour la mise à jour",
  });
