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