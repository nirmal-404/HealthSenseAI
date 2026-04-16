import { randomUUID } from "crypto";
import { DoctorRepository } from "../repositories/doctorRepository";
import { AuthUser } from "../middlewares/auth";
import { ForbiddenError, NotFoundError } from "../errors/AppError";
import { IDoctorProfile } from "../models/DoctorProfile";
import { AppointmentClient } from "./appointmentClient";
import { PatientReportsService } from "./patientReportsService";

/**
 * Doctor profile, availability, appointments, and patient report reads.
 */
export class DoctorService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly appointments: AppointmentClient,
    private readonly patients: PatientReportsService,
  ) {}

  private assertDoctor(user: AuthUser, doctorId: string) {
    const r = user.role?.toLowerCase() || "";
    if (r === "admin") return;
    if (r === "doctor" && (user.id === doctorId || user.email === doctorId)) return;
    
    // Check if user.id matches the doctor's mongo ID if doctorId is a UUID
    // For now, simpler check:
    if (r === "doctor" && user.id !== doctorId) {
       throw new ForbiddenError("Cannot modify another doctor");
    }
  }

  /** Returns doctor profile or 404. */
  async getProfile(doctorId: string) {
    const d = await this.doctors.findByDoctorId(doctorId);
    if (!d) throw new NotFoundError("Doctor profile not found");
    return d;
  }

  /** Creates or updates doctor profile. */
  async upsertProfile(
    doctorId: string,
    body: Partial<IDoctorProfile>,
    user: AuthUser,
  ) {
    this.assertDoctor(user, doctorId);
    return this.doctors.upsertProfile({ ...body, doctorId });
  }

  /** Registers a new doctor profile. */
  async registerProfile(body: Partial<IDoctorProfile>) {
    const doctorId = randomUUID();
    return this.doctors.upsertProfile({ ...body, doctorId });
  }

  /** Searches doctors by speciality and name. */
  async searchDoctors(name?: string, speciality?: string) {
    return this.doctors.searchDoctors(name, speciality);
  }

  /** Returns paginated appointment references when available. */
  async listAppointments(doctorId: string, user: AuthUser) {
    this.assertDoctor(user, doctorId);
    return this.appointments.getDoctorAppointments(doctorId);
  }

  /** Returns weekly slots and blocked dates. */
  async getAvailability(doctorId: string) {
    const d = await this.getProfile(doctorId);
    return {
      weeklySlots: d.weeklySlots,
      blockedDates: d.blockedDates,
    };
  }

  /** Generates time slots for the next seven days based on availability. */
  async getTimeSlots(doctorId: string) {
    const d = await this.getProfile(doctorId);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const blockedDateSet = new Set(d.blockedDates.map((b) => b.date));
    const blockedSlotSet = new Set(d.blockedSlotIds || []);
    const slots: Array<{
      slotId: string;
      date: string;
      startTime: string;
      endTime: string;
      status: string;
    }> = [];

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const dateStr = date.toISOString().slice(0, 10);
      const weekday = dayNames[date.getDay()];

      if (blockedDateSet.has(dateStr)) continue;

      for (const slot of d.weeklySlots) {
        if (slot.dayOfWeek.toLowerCase() !== weekday.toLowerCase()) continue;
        const slotId = `${dateStr}-${slot.startTime}-${slot.endTime}`;
        if (blockedSlotSet.has(slotId)) continue;
        slots.push({
          slotId,
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "available",
        });
      }
    }

    return slots;
  }

  async blockTimeSlot(doctorId: string, slotId: string, user: AuthUser) {
    this.assertDoctor(user, doctorId);
    const d = await this.doctors.addBlockedSlot(doctorId, slotId);
    if (!d) throw new NotFoundError("Doctor profile not found");
    return d;
  }

  /** Replaces availability template and blocked dates. */
  async setAvailability(
    doctorId: string,
    weeklySlots: IDoctorProfile["weeklySlots"],
    blockedDates: IDoctorProfile["blockedDates"],
    user: AuthUser,
  ) {
    this.assertDoctor(user, doctorId);
    const d = await this.doctors.updateAvailability(
      doctorId,
      weeklySlots,
      blockedDates,
    );
    if (!d) throw new NotFoundError("Doctor profile not found");
    return d;
  }

  /** Accepts or rejects an appointment in Appointment service. */
  async respondAppointment(
    appointmentId: string,
    action: "accept" | "reject",
    user: AuthUser,
  ) {
    if (
      user.role?.toLowerCase() !== "doctor" &&
      user.role?.toLowerCase() !== "admin"
    ) {
      throw new ForbiddenError("Only doctors can respond");
    }
    await this.appointments.respond(appointmentId, action);
    return { appointmentId, action, correlationId: randomUUID() };
  }

  /** Proxies patient documents for a doctor. */
  async patientReports(
    doctorId: string,
    patientId: string,
    user: AuthUser,
    authHeader?: string,
  ) {
    this.assertDoctor(user, doctorId);
    const data = await this.patients.fetchPatientDocuments(
      patientId,
      authHeader,
    );
    if (data === null) throw new NotFoundError("Patient reports not found");
    return data;
  }

  /** Internal call for billing data. */
  async getInternalBilling(doctorId: string) {
    const d = await this.getProfile(doctorId);
    return {
      doctorId: d.doctorId,
      userMongoId: d.email, // In this simplified repo, we use email as ID or it might be missing
      consultationFee: 1000, // Hardcoded or default if missing in model
      firstName: d.firstName,
      lastName: d.lastName,
    };
  }
}
