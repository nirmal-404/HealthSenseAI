import axios from "axios";
import { CONFIG } from "../config/envConfig";
import { withRetry } from "../utils/retry";
import { logger } from "../utils/logger";

/**
 * Fetches patient-uploaded reports from Patient Management service.
 */
export class PatientReportsService {
  /**
   * Proxies patient documents list for authorized doctor context.
   */
  async fetchPatientDocuments(
    patientId: string,
    authHeader?: string,
  ): Promise<unknown> {
    const url = `${CONFIG.PATIENT_MANAGEMENT_SERVICE_URL}/patients/${patientId}/documents`;
    return withRetry("patient.documents", async () => {
      const res = await axios.get(url, {
        timeout: CONFIG.HTTP_TIMEOUT_MS,
        headers: authHeader ? { Authorization: authHeader } : {},
        validateStatus: () => true,
      });
      if (res.status === 404) return null;
      if (res.status >= 400) {
        logger.warn("Patient service error", { status: res.status, url });
        throw new Error(`Upstream ${res.status}`);
      }
      return res.data;
    });
  }
}
