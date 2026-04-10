import axios from "axios";
import httpStatus from "http-status";
import DoctorVerification from "../models/DoctorVerification";
import ManagedUserStatus from "../models/ManagedUserStatus";
import PlatformStats from "../models/PlatformStats";
import { CONFIG } from "../config/envConfig";
import { ApiError } from "../utils/ApiError";

type VerificationInput = {
  status: "approved" | "rejected";
  reviewNotes?: string;
  documents?: string[];
};

const systemHeaders = {
  "x-user-id": "admin-service",
  "x-user-role": "admin",
};

const internalHeaders = {
  "x-internal-service-key": CONFIG.INTERNAL_SERVICE_KEY,
};

const syncUserStatusWithUserService = async (
  userId: string,
  status: "active" | "suspended"
) => {
  const url = `${CONFIG.API_GATEWAY_URL}/api/auth/internal/users/${userId}/status`;

  try {
    await axios.put(
      url,
      { status },
      {
        timeout: 5000,
        headers: internalHeaders,
      }
    );
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Failed to sync status to user-service"
    );
  }
};

export const getUsersService = async () => {
  const users = await ManagedUserStatus.find().sort({ updatedAt: -1 });
  return users;
};

export const updateUserStatusService = async (
  userId: string,
  payload: { status: "active" | "suspended"; userType?: "patient" | "doctor" | "admin" | "unknown" },
  updatedBy: string
) => {
  await syncUserStatusWithUserService(userId, payload.status);

  const updated = await ManagedUserStatus.findOneAndUpdate(
    { userId },
    {
      userId,
      status: payload.status,
      userType: payload.userType || "unknown",
      updatedBy,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return updated;
};

export const getPendingVerificationService = async () => {
  const pending = await DoctorVerification.find({ status: "pending" }).sort({ submittedAt: -1 });
  return pending;
};

export const verifyDoctorService = async (
  doctorId: string,
  payload: VerificationInput,
  reviewedBy: string
) => {
  const verification = await DoctorVerification.findOneAndUpdate(
    { doctorId },
    {
      doctorId,
      status: payload.status,
      reviewNotes: payload.reviewNotes || "",
      documents: payload.documents || [],
      reviewedBy,
      reviewedAt: new Date(),
      submittedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return verification;
};

const safeRequest = async (url: string) => {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: systemHeaders,
    });
    return { ok: true, data: response.data };
  } catch (error) {
    return { ok: false, data: null };
  }
};

export const getAnalyticsService = async () => {
  const [doctorSearch, platformStat] = await Promise.all([
    safeRequest(`${CONFIG.DOCTOR_MANAGEMENT_SERVICE_URL}/search`),
    PlatformStats.findOne().sort({ date: -1 }),
  ]);

  const doctorList = doctorSearch.ok ? doctorSearch.data?.data || [] : [];

  const payload = {
    totalPatients: platformStat?.totalPatients || 0,
    totalDoctors: Array.isArray(doctorList) ? doctorList.length : 0,
    totalAppointments: platformStat?.totalAppointments || 0,
    totalRevenue: platformStat?.totalRevenue || 0,
    activeUsers: platformStat?.activeUsers || 0,
    sources: {
      doctors: doctorSearch.ok ? "doctor-service" : "fallback",
      patients: "fallback",
      appointments: "fallback",
      revenue: "fallback",
    },
  };

  return payload;
};

export const getTransactionsService = async () => {
  const paymentResponse = await safeRequest(`${CONFIG.PAYMENT_SERVICE_URL}/transactions`);

  if (!paymentResponse.ok) {
    return {
      transactions: [],
      source: "fallback",
      message: "Payment service unavailable. Returning empty transactions list.",
    };
  }

  return {
    transactions: paymentResponse.data?.data || [],
    source: "payment-service",
    message: "Transactions fetched from payment service.",
  };
};

export const getReportsService = async () => {
  const [analytics, pendingVerifications, transactions] = await Promise.all([
    getAnalyticsService(),
    getPendingVerificationService(),
    getTransactionsService(),
  ]);

  return {
    generatedAt: new Date(),
    analytics,
    pendingVerificationsCount: pendingVerifications.length,
    transactionsSummary: {
      source: transactions.source,
      count: Array.isArray(transactions.transactions) ? transactions.transactions.length : 0,
    },
  };
};