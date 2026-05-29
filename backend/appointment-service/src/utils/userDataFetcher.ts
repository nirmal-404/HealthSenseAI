import axios from "axios";
import { CONFIG } from "../config/envConfig";

/**
 * Fetch patient details from Patient Management Service
 */
export const getPatientDetails = async (patientId: string) => {
  try {
    const response = await axios.get(
      `${CONFIG.PATIENT_MANAGEMENT_SERVICE_URL}/patients/${patientId}`,
      {
        timeout: 5000,
      }
    );

    if (response.data && response.data.data) {
      const patient = response.data.data;
      return {
        name: patient.name || patient.firstName + " " + patient.lastName || "Patient",
        email: patient.email,
        phone: patient.phone || patient.phoneNumber,
      };
    }
    return null;
  } catch (error: any) {
    console.warn(
      `⚠️  Failed to fetch patient details for ID ${patientId}:`,
      error?.message
    );
    return null;
  }
};

/**
 * Fetch doctor details from Doctor Management Service
 */
export const getDoctorDetails = async (doctorId: string) => {
  try {
    const response = await axios.get(
      `${CONFIG.DOCTOR_MANAGEMENT_SERVICE_URL}/doctors/${doctorId}`,
      {
        timeout: 5000,
      }
    );

    if (response.data && response.data.data) {
      const doctor = response.data.data;
      return {
        name: doctor.name || doctor.firstName + " " + doctor.lastName || "Doctor",
        email: doctor.email,
        phone: doctor.phone || doctor.phoneNumber,
      };
    }
    return null;
  } catch (error: any) {
    console.warn(
      `⚠️  Failed to fetch doctor details for ID ${doctorId}:`,
      error?.message
    );
    return null;
  }
};

/**
 * Fetch both patient and doctor details
 */
export const getUserDetailsForAppointment = async (patientId: string, doctorId: string) => {
  try {
    const [patientData, doctorData] = await Promise.all([
      getPatientDetails(patientId),
      getDoctorDetails(doctorId),
    ]);

    return {
      patientName: patientData?.name,
      patientEmail: patientData?.email,
      patientPhone: patientData?.phone,
      doctorName: doctorData?.name,
      doctorEmail: doctorData?.email,
      doctorPhone: doctorData?.phone,
    };
  } catch (error: any) {
    console.warn("⚠️  Error fetching user details:", error?.message);
    return {};
  }
};
