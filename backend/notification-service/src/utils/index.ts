import axios from "axios";
import { CONFIG } from "../config/envConfig";

/**
 * Create an Axios instance with internal service headers
 */
export const internalApiClient = axios.create({
  timeout: 5000,
  headers: {
    "x-internal-service-key": CONFIG.JWT_SECRET,
    "Content-Type": "application/json",
  },
});

/**
 * Utility to make internal service calls
 */
export const callInternalService = async (
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any
) => {
  try {
    const response = await internalApiClient({
      url,
      method,
      data,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error(`Error calling internal service (${url}):`, error.message);
    return {
      success: false,
      error: error?.response?.data || error.message,
    };
  }
};

/**
 * Get user info from User Service
 */
export const getUserInfo = async (userId: string) => {
  return callInternalService(`${CONFIG.USER_SERVICE_URL}/internal/users/${userId}`);
};

/**
 * Get appointment details from Appointment Service
 */
export const getAppointmentDetails = async (appointmentId: string) => {
  return callInternalService(`${CONFIG.APPOINTMENT_SERVICE_URL}/internal/appointments/${appointmentId}`);
};

/**
 * Get doctor details from Doctor Management Service
 */
export const getDoctorDetails = async (doctorId: string) => {
  return callInternalService(`${CONFIG.DOCTOR_MANAGEMENT_SERVICE_URL}/internal/doctors/${doctorId}`);
};

/**
 * Get patient details from Patient Management Service
 */
export const getPatientDetails = async (patientId: string) => {
  return callInternalService(`${CONFIG.PATIENT_MANAGEMENT_SERVICE_URL}/internal/patients/${patientId}`);
};

/**
 * Format phone number to E.164 format for SMS
 */
export const formatPhoneNumber = (phoneNumber: string, countryCode: string = "+94"): string => {
  // Remove common characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // If it starts with 0, replace it with country code
  if (cleaned.startsWith("0")) {
    return countryCode + cleaned.substring(1);
  }

  // If it doesn't have country code, add it
  if (!cleaned.startsWith(countryCode.replace("+", ""))) {
    return countryCode + cleaned;
  }

  return "+" + cleaned;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate notification log message
 */
export const generateNotificationLog = (
  notificationId: string,
  type: string,
  recipient: string,
  status: string,
  error?: string
): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] Notification ${notificationId} | Type: ${type} | Recipient: ${recipient} | Status: ${status} ${
    error ? `| Error: ${error}` : ""
  }`;
};

/**
 * Delay execution (for retry logic)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate appointment summary
 */
export const generateAppointmentSummary = (appointmentData: any): string => {
  return `
Date: ${appointmentData.appointmentDate}
Time: ${appointmentData.appointmentTime}
Doctor: Dr. ${appointmentData.doctorName}
Specialization: ${appointmentData.specialization || "N/A"}
  `;
};
