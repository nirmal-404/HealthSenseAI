import httpStatus from "http-status";
import Appointment from "../models/Appointment";
import AppointmentHistory from "../models/AppointmentHistory";
import { ApiError } from "../utils/ApiError";

type BookAppointmentInput = {
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  appointmentType: "video" | "in-person";
  symptoms?: string;
};

type AppointmentQueryFilter = {
  status?: string;
  date?: Date;
};

const pushHistory = async (
  appointmentId: string,
  statusChange: string,
  changedBy: string,
  notes?: string
) => {
  await AppointmentHistory.create({
    appointmentId,
    statusChange,
    changedBy,
    notes: notes || "",
    timestamp: new Date(),
  });
};

export const bookAppointmentService = async (
  payload: BookAppointmentInput,
  changedBy: string
) => {
  const appointment = await Appointment.create({
    ...payload,
    status: "pending",
    paymentStatus: "pending",
  });

  await pushHistory(appointment.appointmentId, "pending", changedBy, "Appointment booked");

  return appointment;
};

export const getAppointmentService = async (appointmentId: string) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  return appointment;
};

export const rescheduleAppointmentService = async (
  appointmentId: string,
  payload: { appointmentDate: Date; startTime: string; endTime: string; notes?: string },
  changedBy: string
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  if (["cancelled", "rejected", "completed"].includes(appointment.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Appointment cannot be rescheduled in current state");
  }

  appointment.appointmentDate = payload.appointmentDate;
  appointment.startTime = payload.startTime;
  appointment.endTime = payload.endTime;
  appointment.status = "pending";

  await appointment.save();

  await pushHistory(
    appointment.appointmentId,
    "pending",
    changedBy,
    payload.notes || "Appointment rescheduled"
  );

  return appointment;
};

export const cancelAppointmentService = async (
  appointmentId: string,
  changedBy: string
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  if (appointment.status === "completed") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Completed appointments cannot be cancelled");
  }

  appointment.status = "cancelled";
  await appointment.save();
  await pushHistory(appointment.appointmentId, "cancelled", changedBy, "Appointment cancelled");

  return appointment;
};

export const confirmAppointmentService = async (
  appointmentId: string,
  changedBy: string,
  notes?: string
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  appointment.status = "confirmed";
  await appointment.save();
  await pushHistory(appointment.appointmentId, "confirmed", changedBy, notes || "Appointment confirmed");

  return appointment;
};

export const rejectAppointmentService = async (
  appointmentId: string,
  changedBy: string,
  notes?: string
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  appointment.status = "rejected";
  await appointment.save();
  await pushHistory(appointment.appointmentId, "rejected", changedBy, notes || "Appointment rejected");

  return appointment;
};

const buildQuery = (baseFilter: Record<string, string>, filter: AppointmentQueryFilter) => {
  const query: Record<string, any> = { ...baseFilter };

  if (filter.status) {
    query.status = filter.status;
  }

  if (filter.date) {
    const start = new Date(filter.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filter.date);
    end.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: start, $lte: end };
  }

  return query;
};

export const getAppointmentsByPatientService = async (
  patientId: string,
  filter: AppointmentQueryFilter
) => {
  const appointments = await Appointment.find(buildQuery({ patientId }, filter)).sort({
    appointmentDate: -1,
  });

  return appointments;
};

export const getAppointmentsByDoctorService = async (
  doctorId: string,
  filter: AppointmentQueryFilter
) => {
  const appointments = await Appointment.find(buildQuery({ doctorId }, filter)).sort({
    appointmentDate: -1,
  });

  return appointments;
};

export const getAppointmentStatusService = async (appointmentId: string) => {
  const appointment = await Appointment.findOne({ appointmentId }).select(
    "appointmentId status updatedAt"
  );

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  return {
    appointmentId: appointment.appointmentId,
    status: appointment.status,
    updatedAt: (appointment as any).updatedAt,
  };
};