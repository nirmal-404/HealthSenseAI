import Joi from "joi";

export const registerPatientValidation = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid("male", "female", "other").required(),
    address: Joi.string().allow(""),
    password: Joi.string().min(8).required(),
    bloodGroup: Joi.string().allow(""),
    allergies: Joi.array().items(Joi.string()).default([]),
    emergencyContact: Joi.string().allow(""),
  }),
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
      firstName: Joi.string(),
      lastName: Joi.string(),
      phoneNumber: Joi.string(),
      dateOfBirth: Joi.date(),
      gender: Joi.string().valid("male", "female", "other"),
      address: Joi.string().allow(""),
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