import { z } from "zod";

export const doctorIdParam = z.object({ id: z.string().min(1) });

export const patientReportsParams = z.object({
  doctorId: z.string().min(1),
  patientId: z.string().min(1),
});

export const doctorProfileBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  speciality: z.string().min(1),
  qualifications: z.array(z.string()).default([]),
  bio: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export const doctorSearchQuery = z.object({
  specialty: z.string().min(1),
});

export const slotIdParams = z.object({
  id: z.string().min(1),
  slotId: z.string().min(1),
});

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const weeklySlot = z.object({
  dayOfWeek: z.string().min(1),
  startTime: z.string().regex(timeRe, "HH:mm"),
  endTime: z.string().regex(timeRe, "HH:mm"),
});

export const availabilityBody = z.object({
  weeklySlots: z.array(weeklySlot).default([]),
  blockedDates: z.array(z.object({ date: z.string().min(1) })).default([]),
});

export const appointmentRespondParams = z.object({
  id: z.string().min(1),
});

export const appointmentRespondBody = z.object({
  action: z.enum(["accept", "reject"]),
});

const medication = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
});

export const createPrescriptionBody = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  consultationSessionId: z.string().optional(),
  medications: z.array(medication).min(1),
  notes: z.string().optional(),
});

export const prescriptionIdParam = z.object({
  id: z.string().min(1),
});

export const verifyTokenParam = z.object({
  token: z.string().min(1),
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const doctorListParam = z.object({
  doctorId: z.string().min(1),
});
