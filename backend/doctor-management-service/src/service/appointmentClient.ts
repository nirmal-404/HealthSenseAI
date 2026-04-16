import axios from "axios";
import { CONFIG } from "../config/envConfig";
import { withRetry } from "../utils/retry";
import { AppError } from "../errors/AppError";
import { ERROR_CODES } from "../constants";

/**
 * Notifies Appointment service about doctor accept/reject actions.
 */
export class AppointmentClient {
  /**
   * Forwards respond action to appointment microservice (best-effort contract).
   */
  async respond(appointmentId: string, action: "accept" | "reject") {
    const status = action === "accept" ? "confirmed" : "rejected";
    const url = `${CONFIG.APPOINTMENT_SERVICE_URL}/appointments/${appointmentId}`;
    return withRetry("appointment.respond", async () => {
      const res = await axios.patch(
        url,
        { status },
        {
          timeout: CONFIG.HTTP_TIMEOUT_MS,
          validateStatus: () => true,
        },
      );
      if (res.status >= 200 && res.status < 300) return res.data;
      if (res.status === 404) {
        throw new AppError(
          502,
          "Appointment service unavailable or route missing",
          ERROR_CODES.UPSTREAM_ERROR,
        );
      }
      throw new AppError(
        502,
        "Appointment service rejected update",
        ERROR_CODES.UPSTREAM_ERROR,
      );
    });
  }

  /**
   * Fetches appointments for a doctor.
   */
  async getDoctorAppointments(doctorId: string) {
    const url = `${CONFIG.APPOINTMENT_SERVICE_URL}/internal/appointments/doctor/${doctorId}`;
    return withRetry("appointment.listByDoctor", async () => {
      const res = await axios.get(url, {
        timeout: CONFIG.HTTP_TIMEOUT_MS,
        validateStatus: () => true,
      });
      if (res.status === 200) return res.data;
      return { items: [], message: "No appointments or service error" };
    });
  }
}
