import Joi from "joi";
import { objectId, passwordPattern } from "./globalValidation";

export const loginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "L'email doit être une adresse valide",
  }),
  password: Joi.string().required(),
});
