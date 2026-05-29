import Joi from "joi";

export const userStatusValidation = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid("active", "suspended").required(),
    userType: Joi.string().valid("patient", "doctor", "admin", "unknown").default("unknown"),
  }),
};

export const doctorIdValidation = {
  params: Joi.object().keys({
    doctorId: Joi.string().required(),
  }),
};

export const doctorVerificationValidation = {
  params: Joi.object().keys({
    doctorId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid("approved", "rejected").required(),
    reviewNotes: Joi.string().allow(""),
    documents: Joi.array().items(Joi.string()).default([]),
  }),
};