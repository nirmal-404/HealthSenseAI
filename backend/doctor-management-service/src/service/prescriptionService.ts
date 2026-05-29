import { randomUUID } from "crypto";
import { PrescriptionRepository } from "../repositories/prescriptionRepository";
import { AuthUser } from "../middlewares/auth";
import { ForbiddenError, NotFoundError } from "../errors/AppError";
import { CONFIG } from "../config/envConfig";
import { buildPrescriptionPdf } from "../utils/prescriptionPdf";
import {
  signPrescriptionToken,
  verifyPrescriptionToken,
} from "../utils/prescriptionJwt";
import { IPrescription, MedicationLine } from "../models/Prescription";

export type CreateRxInput = {
  patientId: string;
  doctorId: string;
  consultationSessionId?: string;
  medications: MedicationLine[];
  notes?: string;
};

/**
 * Prescription issuance and verification helpers.
 */
export class PrescriptionService {
  constructor(private readonly repo: PrescriptionRepository) {}

  private assertDoctor(user: AuthUser, doctorId: string) {
    const r = user.role?.toLowerCase() || "";
    if (r === "admin") return;
    if (r === "doctor" && user.id !== doctorId) {
      throw new ForbiddenError("Cannot issue for another doctor");
    }
  }

  /** Issues prescription, PDF, QR JWT, persists record. */
  async create(input: CreateRxInput, user: AuthUser) {
    this.assertDoctor(user, input.doctorId);
    const prescriptionId = randomUUID();
    const verifyJwt = signPrescriptionToken(prescriptionId);
    const verifyUrl = `${CONFIG.PUBLIC_BASE_URL}/prescriptions/verify/${verifyJwt}`;
    const pdfBuffer = await buildPrescriptionPdf(
      {
        prescriptionId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        medications: input.medications,
        notes: input.notes,
        consultationSessionId: input.consultationSessionId,
      },
      verifyUrl,
    );
    const doc = await this.repo.create({
      prescriptionId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      consultationSessionId: input.consultationSessionId,
      medications: input.medications,
      notes: input.notes,
      pdfBuffer,
      verifyJwt,
    } as IPrescription);
    return {
      prescriptionId: doc.prescriptionId,
      patientId: doc.patientId,
      doctorId: doc.doctorId,
      verifyUrl,
      pdfBase64: pdfBuffer.toString("base64"),
      createdAt: doc.createdAt,
    };
  }

  private assertCanViewPrescription(p: { doctorId: string; patientId: string }, user: AuthUser) {
    const r = user.role?.toLowerCase() || "";
    if (r === "admin") return;
    if (r === "doctor" && user.id !== p.doctorId) {
      throw new ForbiddenError("Cannot view another doctor's prescription");
    }
    if (r === "patient" && user.id !== p.patientId) {
      throw new ForbiddenError("Cannot view another patient's prescription");
    }
  }

  /** Returns prescription metadata plus PDF base64. */
  async getById(prescriptionId: string, user: AuthUser) {
    const p = await this.repo.findById(prescriptionId);
    if (!p) throw new NotFoundError("Prescription not found");
    this.assertCanViewPrescription(p, user);
    const verifyUrl = `${CONFIG.PUBLIC_BASE_URL}/prescriptions/verify/${p.verifyJwt}`;
    return {
      prescriptionId: p.prescriptionId,
      patientId: p.patientId,
      doctorId: p.doctorId,
      medications: p.medications,
      notes: p.notes,
      verifyUrl,
      pdfBase64: p.pdfBuffer.toString("base64"),
      createdAt: p.createdAt,
    };
  }

  /** Lists prescriptions for a doctor with pagination. */
  async listByDoctor(doctorId: string, page: number, limit: number, user: AuthUser) {
    this.assertDoctor(user, doctorId);
    return this.repo.listByDoctor(doctorId, page, limit);
  }

  /** Lists prescriptions for a patient with pagination. */
  async listByPatient(patientId: string, page: number, limit: number, user: AuthUser) {
    const role = user.role?.toLowerCase() || "";
    if (role === "admin") {
      return this.repo.listByPatient(patientId, page, limit);
    }

    if (role === "patient" && user.id === patientId) {
      return this.repo.listByPatient(patientId, page, limit);
    }

    throw new ForbiddenError("Cannot view another patient's prescriptions");
  }

  /** Public QR verification payload. */
  async verifyPublic(token: string) {
    const payload = verifyPrescriptionToken(token);
    if (!payload) {
      return { valid: false as const, reason: "Invalid or expired token" };
    }
    const p = await this.repo.findById(payload.prescriptionId);
    if (!p) return { valid: false as const, reason: "Prescription not found" };
    return {
      valid: true as const,
      prescription: {
        prescriptionId: p.prescriptionId,
        patientId: p.patientId,
        doctorId: p.doctorId,
        medications: p.medications,
        notes: p.notes,
        createdAt: p.createdAt,
      },
    };
  }
}
