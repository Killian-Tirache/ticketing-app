import Joi from "joi";
import { objectId } from "./globalValidation";

export const createLogValidation = Joi.object({
  userId: objectId.required(),
  action: Joi.string()
    .valid("create", "update", "delete", "register", "login", "logout", "error")
    .required(),
  entity: Joi.string().required(),
  entityId: objectId.optional(),
  success: Joi.boolean().required(),
  message: Joi.string().optional(),
  details: Joi.object().optional(),
});
