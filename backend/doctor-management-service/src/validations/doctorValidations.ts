import Joi from "joi";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const registerDoctorValidation = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid("male", "female", "other").required(),
    address: Joi.string().allow(""),
    password: Joi.string().min(8).required(),
    specialization: Joi.string().required(),
    qualification: Joi.array().items(Joi.string()).default([]),
    licenseNumber: Joi.string().required(),
    experience: Joi.number().min(0).default(0),
    consultationFee: Joi.number().min(0).default(0),
    biography: Joi.string().allow(""),
    profileImage: Joi.string().uri().allow(""),
  }),
};

export const doctorIdValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const updateDoctorProfileValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      firstName: Joi.string(),
      lastName: Joi.string(),
      phoneNumber: Joi.string(),
      specialization: Joi.string(),
      qualification: Joi.array().items(Joi.string()),
      experience: Joi.number().min(0),
      consultationFee: Joi.number().min(0),
      biography: Joi.string().allow(""),
      profileImage: Joi.string().uri().allow(""),
      isVerified: Joi.boolean(),
      rating: Joi.number().min(0).max(5),
    })
    .min(1),
};

export const setAvailabilityValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    dayOfWeek: Joi.string()
      .valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
      .required(),
    startTime: Joi.string().pattern(timePattern).required(),
    endTime: Joi.string().pattern(timePattern).required(),
    slotDuration: Joi.number().integer().min(5).default(30),
    isActive: Joi.boolean().default(true),
  }),
};

export const getTimeSlotsValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  query: Joi.object().keys({
    date: Joi.date(),
    status: Joi.string().valid("available", "booked", "blocked"),
  }),
};

export const blockTimeSlotValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
    slotId: Joi.string().required(),
  }),
};

export const searchDoctorValidation = {
  query: Joi.object().keys({
    specialty: Joi.string(),
    name: Joi.string(),
  }),
};

export const doctorAppointmentsValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};