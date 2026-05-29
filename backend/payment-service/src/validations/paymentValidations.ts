import Joi from "joi";

export const createPaymentIntentValidation = {
  body: Joi.object().keys({
    appointmentId: Joi.string().required(),
    notes: Joi.string().allow(""),
  }),
};

export const processPaymentValidation = {
  params: Joi.object().keys({
    appointmentId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    paymentMethod: Joi.string().valid("mock", "stripe", "payhere").default("mock"),
    notes: Joi.string().allow(""),
  }),
};

export const paymentIdValidation = {
  params: Joi.object().keys({
    paymentId: Joi.string().required(),
  }),
};

export const patientHistoryValidation = {
  params: Joi.object().keys({
    patientId: Joi.string().required(),
  }),
};

export const refundPaymentValidation = {
  params: Joi.object().keys({
    paymentId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string().allow(""),
  }),
};

export const paymentDetailsValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};
