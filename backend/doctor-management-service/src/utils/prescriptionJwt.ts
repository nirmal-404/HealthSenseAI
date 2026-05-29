import jwt from "jsonwebtoken";
import { CONFIG } from "../config/envConfig";

const ONE_YEAR_SEC = 365 * 24 * 60 * 60;

/**
 * Signs a prescription verification JWT (1 year expiry).
 */
export function signPrescriptionToken(prescriptionId: string): string {
  return jwt.sign({ prescriptionId }, CONFIG.PRESCRIPTION_JWT_SECRET, {
    expiresIn: ONE_YEAR_SEC,
  });
}

/**
 * Verifies prescription JWT and returns payload or null.
 */
export function verifyPrescriptionToken(
  token: string,
): { prescriptionId: string } | null {
  try {
    const p = jwt.verify(token, CONFIG.PRESCRIPTION_JWT_SECRET) as {
      prescriptionId: string;
    };
    return p.prescriptionId ? p : null;
  } catch {
    return null;
  }
}
