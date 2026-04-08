import httpStatus from "http-status";
import MedicalDocument from "../models/MedicalDocument";
import MedicalHistory from "../models/MedicalHistory";
import Patient from "../models/Patient";
import Prescription from "../models/Prescription";
import { ApiError } from "../utils/ApiError";

type RegisterPatientInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: string;
};

type UploadDocumentInput = {
  documentType: string;
  fileName: string;
  fileUrl: string;
  description?: string;
};

export const registerPatientService = async (payload: RegisterPatientInput) => {
  const existingPatient = await Patient.findOne({ email: payload.email.toLowerCase() });

  if (existingPatient) {
    throw new ApiError(httpStatus.CONFLICT, "Patient with this email already exists");
  }

  const patient = await Patient.create({
    ...payload,
    email: payload.email.toLowerCase(),
  });

  return patient;
};

export const updatePatientProfileService = async (
  patientId: string,
  payload: Partial<RegisterPatientInput>
) => {
  const patient = await Patient.findOneAndUpdate({ patientId }, payload, {
    new: true,
    runValidators: true,
  });

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  }

  return patient;
};

export const uploadPatientDocumentService = async (
  patientId: string,
  payload: UploadDocumentInput
) => {
  const patient = await Patient.findOne({ patientId });

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  }

  const document = await MedicalDocument.create({
    patientId,
    ...payload,
    uploadDate: new Date(),
  });

  return document;
};

export const getPatientMedicalHistoryService = async (patientId: string) => {
  const history = await MedicalHistory.find({ patientId }).sort({ diagnosisDate: -1 });
  return history;
};

export const getPatientPrescriptionsService = async (patientId: string) => {
  const prescriptions = await Prescription.find({ patientId }).sort({ issuedDate: -1 });
  return prescriptions;
};

export const getPatientDashboardService = async (patientId: string) => {
  const patient = await Patient.findOne({ patientId });

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  }

  const [recentDocuments, medicalHistory, prescriptions] = await Promise.all([
    MedicalDocument.find({ patientId }).sort({ uploadDate: -1 }).limit(5),
    MedicalHistory.find({ patientId }).sort({ diagnosisDate: -1 }).limit(5),
    Prescription.find({ patientId }).sort({ issuedDate: -1 }).limit(5),
  ]);

  return {
    patient,
    summary: {
      documentsCount: recentDocuments.length,
      medicalHistoryCount: medicalHistory.length,
      prescriptionsCount: prescriptions.length,
    },
    recentDocuments,
    recentMedicalHistory: medicalHistory,
    recentPrescriptions: prescriptions,
  };
};