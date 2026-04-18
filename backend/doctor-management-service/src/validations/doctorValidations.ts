import Joi from "joi";

export const registerDoctorValidation = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().allow(""),
    speciality: Joi.string().required(),
    qualifications: Joi.array().items(Joi.string()).default([]),
    bio: Joi.string().allow(""),
    licenseNumber: Joi.string().allow(""),
    // Also allow old names for compatibility if needed
    specialization: Joi.string(),
    qualification: Joi.array().items(Joi.string()),
    biography: Joi.string().allow(""),
    // Optional fields for registration if they are passed
    dateOfBirth: Joi.date(),
    gender: Joi.string().valid("male", "female", "other"),
    password: Joi.string().min(8),
    confirmPassword: Joi.string().min(8),
    address: Joi.string().allow(""),
  }).with('password', 'confirmPassword').unknown(true),
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
      speciality: Joi.string(),
      qualifications: Joi.array().items(Joi.string()),
      bio: Joi.string().allow(""),
      licenseNumber: Joi.string(),
      // Also allow old names
      specialization: Joi.string(),
      qualification: Joi.array().items(Joi.string()),
      biography: Joi.string().allow(""),
    })
    .min(1),
};

export const setAvailabilityValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    weeklySlots: Joi.array().items(
      Joi.object().keys({
        dayOfWeek: Joi.string().required(),
        startTime: Joi.string().required(),
        endTime: Joi.string().required(),
      })
    ),
    blockedDates: Joi.array().items(
      Joi.object().keys({
        date: Joi.string().required(),
      })
    ),
  }),
};

export const getTimeSlotsValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
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
    speciality: Joi.string(),
    specialty: Joi.string(),
    name: Joi.string(),
  }),
};

export const doctorIdValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const doctorAppointmentsValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const internalDoctorBillingValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const createPrescriptionValidation = {
  body: Joi.object().keys({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    consultationSessionId: Joi.string().allow(""),
    medications: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().required(),
          dosage: Joi.string().required(),
          frequency: Joi.string().required(),
          duration: Joi.string().required(),
        })
      )
      .min(1)
      .required(),
    notes: Joi.string().allow(""),
  }),
};

export const listPrecscriptionsValidation = {
  params: Joi.object().keys({
    doctorId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export const listPatientPrescriptionsValidation = {
  params: Joi.object().keys({
    patientId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export const prescriptionIdValidation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

export const verifyPrescriptionValidation = {
  params: Joi.object().keys({
    token: Joi.string().required(),
  }),
};