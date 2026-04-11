import httpStatus from "http-status";
import MedicalDocument from "../models/MedicalDocument";
import MedicalHistory from "../models/MedicalHistory";
import Patient from "../models/Patient";
import Prescription from "../models/Prescription";
import { ApiError } from "../utils/ApiError";
import axios from "axios";
import { CONFIG } from "../config/envConfig";

type CreatePatientProfileInput = {
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: string;
};

type UpdatePatientProfileInput = Partial<CreatePatientProfileInput>;

type InternalUserRecord = {
  id: string;
  role: "patient" | "doctor" | "admin";
  isActive: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date | string;
  gender: "male" | "female" | "other";
  address?: string;
};

type UploadDocumentInput = {
  documentType: string;
  fileName: string;
  fileUrl: string;
  description?: string;
};

const fetchUserForPatientProfile = async (userMongoId: string): Promise<InternalUserRecord> => {
  try {
    const userLookupUrl = `${CONFIG.USER_SERVICE_URL}/internal/users/${encodeURIComponent(userMongoId)}`;
    const userResponse = await axios.get<{ data?: InternalUserRecord }>(userLookupUrl, {
      headers: {
        "x-internal-service-key": CONFIG.JWT_SECRET,
      },
      timeout: 5000,
    });

    const user = userResponse.data?.data;
    if (!user) {
      throw new ApiError(httpStatus.BAD_GATEWAY, "User service response did not include user data");
    }

    return user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === httpStatus.NOT_FOUND) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
      }

      if (status === httpStatus.UNAUTHORIZED || status === httpStatus.FORBIDDEN) {
        throw new ApiError(httpStatus.BAD_GATEWAY, "User service internal authentication failed");
      }

      throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to fetch user details from user service");
    }

    throw error;
  }
};

export const createPatientProfileService = async (
  userMongoId: string,
  payload: CreatePatientProfileInput
) => {
  const existingPatient = await Patient.findOne({ userMongoId });

  if (existingPatient) {
    throw new ApiError(httpStatus.CONFLICT, "Patient profile already exists for this user");
  }

  const user = await fetchUserForPatientProfile(userMongoId);

  if (user.role !== "patient") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only patient users can create a patient profile");
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Cannot create profile for an inactive user");
  }

  const patient = await Patient.create({
    userMongoId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email.toLowerCase(),
    phoneNumber: user.phoneNumber,
    dateOfBirth: new Date(user.dateOfBirth),
    gender: user.gender,
    address: user.address || "",
    bloodGroup: payload.bloodGroup || "",
    allergies: payload.allergies || [],
    emergencyContact: payload.emergencyContact || "",
  });

  return patient;
};

export const updatePatientProfileService = async (
  patientId: string,
  payload: UpdatePatientProfileInput
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