import Joi from "joi";

export const bookAppointmentValidation = {
  body: Joi.object().keys({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    appointmentDate: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    appointmentType: Joi.string().valid("video", "in-person").required(),
    symptoms: Joi.string().allow(""),
  }),
};

export const appointmentIdValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const rescheduleAppointmentValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    appointmentDate: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    notes: Joi.string().allow(""),
  }),
};

export const decisionValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    notes: Joi.string().allow(""),
  }),
};

export const byPatientValidation = {
  params: Joi.object().keys({
    patientId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid("pending", "confirmed", "completed", "cancelled", "rejected"),
    date: Joi.date(),
  }),
};

export const byDoctorValidation = {
  params: Joi.object().keys({
    doctorId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid("pending", "confirmed", "completed", "cancelled", "rejected"),
    date: Joi.date(),
  }),
};