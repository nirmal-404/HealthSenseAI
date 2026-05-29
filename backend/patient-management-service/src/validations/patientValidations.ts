import Joi from "joi";

export const createPatientProfileValidation = {
  body: Joi.object()
    .keys({
      bloodGroup: Joi.string().allow(""),
      allergies: Joi.array().items(Joi.string()).default([]),
      emergencyContact: Joi.string().allow(""),
    })
    .min(1),
};

export const patientIdValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const updatePatientValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      bloodGroup: Joi.string().allow(""),
      allergies: Joi.array().items(Joi.string()),
      emergencyContact: Joi.string().allow(""),
    })
    .min(1),
};

export const uploadDocumentValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    documentType: Joi.string().required(),
    fileName: Joi.string().required(),
    fileUrl: Joi.string().uri().required(),
    description: Joi.string().allow(""),
  }),
};

export const internalPatientIdentityValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const medicationLineSchema = Joi.object({
  name: Joi.string().trim().required(),
  dosage: Joi.string().trim().required(),
  frequency: Joi.string().trim().required(),
  duration: Joi.string().trim().required(),
});

export const createPrescriptionValidation = {
  body: Joi.object().keys({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    appointmentId: Joi.string().required(),
    medications: Joi.array().items(medicationLineSchema).min(1).max(30).required(),
    notes: Joi.string().allow(""),
  }),
};

export const updatePrescriptionValidation = {
  params: Joi.object().keys({
    prescriptionId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      medications: Joi.array().items(medicationLineSchema).min(1).max(30),
      notes: Joi.string().allow(""),
    })
    .min(1),
};

export const prescriptionIdValidation = {
  params: Joi.object().keys({
    prescriptionId: Joi.string().required(),
  }),
};

export const doctorPrescriptionsValidation = {
  params: Joi.object().keys({
    doctorId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    patientId: Joi.string(),
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    search: Joi.string().allow(""),
  }),
};

export const patientPrescriptionsValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  query: Joi.object().keys({
    doctorId: Joi.string(),
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    search: Joi.string().allow(""),
  }),
};