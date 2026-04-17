import { z } from "zod";

export const createSessionBodySchema = z.object({
  doctorId: z.string().min(1),
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  appointmentType: z.literal("video"),
  appointmentDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  consultationFee: z.number().nonnegative().optional(),
  doctorName: z.string().min(1).optional(),
  patientName: z.string().min(1).optional(),
});

export const endSessionBodySchema = z.object({
  recordingUrl: z.string().url().optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const soapNoteResponseSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
  followUpDate: z.union([z.string(), z.null()]),
  urgencyLevel: z.enum(["low", "medium", "high"]),
});

export const sessionIdParamSchema = z.object({
  id: z.string().min(1),
});

export const doctorIdParamSchema = z.object({
  doctorId: z.string().min(1),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().min(1),
});
