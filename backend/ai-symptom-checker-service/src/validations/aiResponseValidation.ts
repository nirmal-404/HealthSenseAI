import Joi from "joi";

export const symptomCheckCreateSchema = {
  body: Joi.object().keys({
    rawInput: Joi.string().trim().min(10).max(2000).required().messages({
      "string.min":
        "Please describe your symptoms in at least 10 characters so we can help you.",
      "string.max": "Description is too long. Please keep it under 2000 characters.",
      "any.required": "A symptom description is required.",
    }),
    patientPerceivedSeverity: Joi.string()
      .valid("mild", "moderate", "severe")
      .optional(),
    additionalContext: Joi.string().trim().max(500).optional(),
  })
};

export const symptomCheckByIdSchema = {
  params: Joi.object().keys({
    checkId: Joi.string().required()
  })
};

export const patientHistoryParamsSchema = {
  params: Joi.object().keys({
    patientId: Joi.string().required()
  })
};

export const patientHistorySchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    urgencyLevel: Joi.string().valid("low", "medium", "high", "emergency").optional(),
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().min(Joi.ref("fromDate")).optional().messages({
      "date.min": '"toDate" must be after "fromDate".',
    }),
  })
};

export const symptomSuggestionsQuerySchema = Joi.object({
  query: Joi.string().trim().min(2).max(100).required(),
  category: Joi.string()
    .valid(
      "neurological",
      "respiratory",
      "cardiovascular",
      "gastrointestinal",
      "musculoskeletal",
      "dermatological",
      "psychological",
      "general",
      "other"
    )
    .optional(),
  limit: Joi.number().integer().min(1).max(20).default(10),
});