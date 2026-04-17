import httpStatus from "http-status";
import MedicalDocument from "../models/MedicalDocument";
import MedicalHistory from "../models/MedicalHistory";
import Patient from "../models/Patient";
import mongoose from "mongoose";
import Prescription, { IMedicationLine, IPrescription } from "../models/Prescription";
import { ApiError } from "../utils/ApiError";
import axios from "axios";
import { CONFIG } from "../config/envConfig";
import { buildPrescriptionPdf } from "../utils/prescriptionPdf";

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

type PrescriptionFilters = {
  doctorId?: string;
  patientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

type CreatePrescriptionInput = {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medications: IMedicationLine[];
  notes?: string;
};

type UpdatePrescriptionInput = {
  medications?: IMedicationLine[];
  notes?: string;
};

type RequestActor = {
  id: string;
  role: string;
};

type AppointmentContext = {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  status: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  appointmentType: "video" | "in-person";
};

const buildPrescriptionQuery = (
  baseFilter: Record<string, unknown>,
  filters: PrescriptionFilters
) => {
  const query: Record<string, unknown> = { ...baseFilter };

  if (filters.doctorId) {
    query.doctorId = filters.doctorId;
  }

  if (filters.patientId) {
    query.patientId = filters.patientId;
  }

  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      dateFilter.$gte = from;
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }

    query.issuedDate = dateFilter;
  }

  if (filters.search?.trim()) {
    const safeSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safeSearch, "i");

    query.$or = [
      { notes: regex },
      { medications: { $elemMatch: { name: regex } } },
      { medications: { $elemMatch: { dosage: regex } } },
      { medications: { $elemMatch: { frequency: regex } } },
      { medications: { $elemMatch: { duration: regex } } },
    ];
  }

  return query;
};

const serializePrescription = (prescription: IPrescription) => {
  const raw =
    typeof (prescription as any).toObject === "function"
      ? (prescription as any).toObject()
      : prescription;

  const normalizedMedications = Array.isArray(raw.medications)
    ? raw.medications.map((medication: any) => {
        if (typeof medication === "string") {
          return {
            name: medication,
            dosage: "As directed",
            frequency: "As directed",
            duration: "As directed",
          };
        }

        return {
          name: medication?.name || "Medication",
          dosage: medication?.dosage || "As directed",
          frequency: medication?.frequency || "As directed",
          duration: medication?.duration || "As directed",
        };
      })
    : [];

  return {
    prescriptionId: raw.prescriptionId,
    patientId: raw.patientId,
    doctorId: raw.doctorId,
    appointmentId: raw.appointmentId,
    medications: normalizedMedications,
    notes: raw.notes,
    issuedDate: raw.issuedDate,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const assertDoctorWriter = (actor: RequestActor, doctorId: string) => {
  const role = actor.role.toLowerCase();

  if (role === "admin") {
    return;
  }

  if (role !== "doctor") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only doctors can manage prescriptions");
  }

  if (actor.id !== doctorId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Cannot manage another doctor's prescriptions");
  }
};

const assertDoctorWriterForPrescription = (actor: RequestActor, prescription: IPrescription) => {
  const role = actor.role.toLowerCase();

  if (role === "admin") {
    return;
  }

  if (role !== "doctor" || actor.id !== prescription.doctorId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }
};

const fetchAppointmentForPrescription = async (
  appointmentId: string
): Promise<AppointmentContext> => {
  try {
    const response = await axios.get<{ data?: AppointmentContext }>(
      `${CONFIG.APPOINTMENT_SERVICE_URL}/appointments/${encodeURIComponent(appointmentId)}`,
      {
        headers: {
          "x-internal-service-key": CONFIG.JWT_SECRET,
        },
        timeout: 5000,
      }
    );

    const appointment = response.data?.data;
    if (!appointment) {
      throw new ApiError(httpStatus.BAD_GATEWAY, "Appointment service response was invalid");
    }

    return appointment;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;

      if (statusCode === httpStatus.NOT_FOUND) {
        throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
      }

      if (statusCode === httpStatus.UNAUTHORIZED || statusCode === httpStatus.FORBIDDEN) {
        throw new ApiError(
          httpStatus.BAD_GATEWAY,
          "Appointment service internal authentication failed"
        );
      }

      throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to validate appointment details");
    }

    throw error;
  }
};

const buildPrescriptionPdfBuffer = async (payload: {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  issuedDate: Date;
  medications: IMedicationLine[];
  notes?: string;
}) => {
  return buildPrescriptionPdf(payload);
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

export const createPrescriptionService = async (
  payload: CreatePrescriptionInput,
  actor: RequestActor
) => {
  assertDoctorWriter(actor, payload.doctorId);

  const appointment = await fetchAppointmentForPrescription(payload.appointmentId);

  if (appointment.status !== "confirmed") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Prescription can only be created for confirmed appointments"
    );
  }

  if (appointment.paymentStatus !== "paid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Prescription can only be created for paid appointments"
    );
  }

  if (appointment.doctorId !== payload.doctorId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Appointment doctor does not match prescription doctor"
    );
  }

  if (appointment.patientId !== payload.patientId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Appointment patient does not match prescription patient"
    );
  }

  const duplicate = await Prescription.findOne({ appointmentId: payload.appointmentId }).select(
    "prescriptionId"
  );

  if (duplicate) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A prescription already exists for this appointment"
    );
  }

  const issuedDate = new Date();
  const prescriptionId = new mongoose.Types.ObjectId().toString();
  const pdfBuffer = await buildPrescriptionPdfBuffer({
    prescriptionId,
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    appointmentId: payload.appointmentId,
    issuedDate,
    medications: payload.medications,
    notes: payload.notes,
  });

  const prescription = await Prescription.create({
    prescriptionId,
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    appointmentId: payload.appointmentId,
    medications: payload.medications,
    notes: payload.notes || "",
    issuedDate,
    pdfBuffer,
  });

  return serializePrescription(prescription);
};

export const getPatientPrescriptionsService = async (
  patientId: string,
  filters: PrescriptionFilters = {}
) => {
  const prescriptions = await Prescription.find(
    buildPrescriptionQuery({ patientId }, filters)
  )
    .sort({ issuedDate: -1 })
    .select("-pdfBuffer");

  return prescriptions.map((prescription) => serializePrescription(prescription));
};

export const getDoctorPrescriptionsService = async (
  doctorId: string,
  filters: PrescriptionFilters = {}
) => {
  const prescriptions = await Prescription.find(
    buildPrescriptionQuery({ doctorId }, filters)
  )
    .sort({ issuedDate: -1 })
    .select("-pdfBuffer");

  return prescriptions.map((prescription) => serializePrescription(prescription));
};

export const getPrescriptionByIdService = async (prescriptionId: string) => {
  const prescription = await Prescription.findOne({ prescriptionId }).select("-pdfBuffer");

  if (!prescription) {
    throw new ApiError(httpStatus.NOT_FOUND, "Prescription not found");
  }

  return serializePrescription(prescription);
};

export const updatePrescriptionService = async (
  prescriptionId: string,
  payload: UpdatePrescriptionInput,
  actor: RequestActor
) => {
  const prescription = await Prescription.findOne({ prescriptionId });

  if (!prescription) {
    throw new ApiError(httpStatus.NOT_FOUND, "Prescription not found");
  }

  assertDoctorWriterForPrescription(actor, prescription);

  const appointment = await fetchAppointmentForPrescription(prescription.appointmentId);

  if (appointment.status !== "confirmed" || appointment.paymentStatus !== "paid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Prescription can only be edited while appointment remains confirmed and paid"
    );
  }

  if (payload.medications) {
    prescription.medications = payload.medications;
  }

  if (payload.notes !== undefined) {
    prescription.notes = payload.notes;
  }

  prescription.issuedDate = new Date();
  prescription.pdfBuffer = await buildPrescriptionPdfBuffer({
    prescriptionId: prescription.prescriptionId,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    appointmentId: prescription.appointmentId,
    issuedDate: prescription.issuedDate,
    medications: prescription.medications,
    notes: prescription.notes,
  });

  await prescription.save();

  return serializePrescription(prescription);
};

export const deletePrescriptionService = async (
  prescriptionId: string,
  actor: RequestActor
) => {
  const prescription = await Prescription.findOne({ prescriptionId });

  if (!prescription) {
    throw new ApiError(httpStatus.NOT_FOUND, "Prescription not found");
  }

  assertDoctorWriterForPrescription(actor, prescription);

  await Prescription.deleteOne({ prescriptionId });

  return {
    prescriptionId: prescription.prescriptionId,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    appointmentId: prescription.appointmentId,
    deletedAt: new Date(),
  };
};

export const getPrescriptionDocumentService = async (prescriptionId: string) => {
  const prescription = await Prescription.findOne({ prescriptionId });

  if (!prescription) {
    throw new ApiError(httpStatus.NOT_FOUND, "Prescription not found");
  }

  return {
    prescription: serializePrescription(prescription),
    pdfBuffer: prescription.pdfBuffer,
  };
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

export const getInternalPatientIdentityService = async (patientId: string) => {
  let patient = await Patient.findOne({ patientId }).select(
    "patientId userMongoId firstName lastName email"
  );

  if (!patient) {
    patient = await Patient.findOne({ userMongoId: patientId }).select(
      "patientId userMongoId firstName lastName email"
    );
  }

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  }

  return {
    patientId: patient.patientId,
    userMongoId: patient.userMongoId || "",
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
  };
};