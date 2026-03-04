import Joi from "joi";
import { objectId } from "./globalValidation";

export const createTicketValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed")
    .optional()
    .default("open"),
  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .optional()
    .default("medium"),
  type: Joi.string()
    .valid("bug", "feature", "support", "incident")
    .optional()
    .default("support"),
  company: objectId.required(),
  assignedTo: objectId.optional(),
});

export const updateTicketValidation = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed")
    .optional(),
  priority: Joi.string().valid("low", "medium", "high", "critical").optional(),
  type: Joi.string().valid("bug", "feature", "support", "incident").optional(),
  assignedTo: Joi.alternatives()
    .try(objectId, Joi.valid(null))
    .optional(),
});
