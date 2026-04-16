import httpStatus from "http-status";
import Appointment from "../models/Appointment";
import AppointmentHistory from "../models/AppointmentHistory";
import { ApiError } from "../utils/ApiError";
import RabbitMQProducer from "../utils/RabbitMQProducer";
import { getUserDetailsForAppointment } from "../utils/userDataFetcher";

type BookAppointmentInput = {
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  appointmentType: "video" | "in-person";
  symptoms?: string;
  // Optional notification fields
  doctorName?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorEmail?: string;
  doctorPhone?: string;
};

type AppointmentQueryFilter = {
  status?: string;
  date?: Date;
};

type UpdateAppointmentPaymentStatusInput = {
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  notes?: string;
};

type ConfirmAppointmentPaymentInput = {
  appointmentId: string;
  paymentId: string;
  status: "pending" | "success" | "failed" | "refunded";
  notes?: string;
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

  // Publish appointment booked event to RabbitMQ
  try {
    // Fetch user details if not provided in payload
    let userDetails = {
      doctorName: payload.doctorName,
      patientName: payload.patientName,
      patientEmail: payload.patientEmail,
      patientPhone: payload.patientPhone,
      doctorEmail: payload.doctorEmail,
      doctorPhone: payload.doctorPhone,
    };

    // Only fetch from external services if data is missing
    if (
      !userDetails.patientEmail ||
      !userDetails.patientPhone ||
      !userDetails.doctorEmail ||
      !userDetails.doctorPhone
    ) {
      console.log(
        `📥 Fetching user details for patientId: ${appointment.patientId}, doctorId: ${appointment.doctorId}`
      );
      const fetchedDetails = await getUserDetailsForAppointment(
        appointment.patientId,
        appointment.doctorId
      );

      // Merge fetched details with payload data (payload takes precedence)
      userDetails = {
        ...fetchedDetails,
        ...userDetails,
      };
      console.log(`✓ User details fetched and merged`);
    }

    const eventPayload = {
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.startTime,
      status: "booked",
      ...userDetails,
    };

    console.log(` Publishing appointment.booked with details:`, {
      appointmentId: eventPayload.appointmentId,
      patientEmail: eventPayload.patientEmail,
      doctorEmail: eventPayload.doctorEmail,
    });

    await RabbitMQProducer.publishAppointmentBooked(eventPayload);
  } catch (error: any) {
    console.error("Error publishing appointment booked event:", error?.message);
    // Don't fail the booking if event publishing fails
  }

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
  notes?: string,
  adoptionalData?: any
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  if (appointment.status !== "pending") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only pending appointments can be confirmed");
  }

  appointment.status = "confirmed";
  await appointment.save();
  await pushHistory(appointmentId, "confirmed", changedBy, notes || "Appointment confirmed by doctor");

  // Publish appointment confirmed event to RabbitMQ
  try {
    // Prepare user details (from provided data or fetch from services)
    let userDetails = {
      doctorName: adoptionalData?.doctorName,
      patientName: adoptionalData?.patientName,
      patientEmail: adoptionalData?.patientEmail,
      patientPhone: adoptionalData?.patientPhone,
      doctorEmail: adoptionalData?.doctorEmail,
      doctorPhone: adoptionalData?.doctorPhone,
    };

    // Fetch details if not provided
    if (
      !userDetails.patientEmail ||
      !userDetails.patientPhone ||
      !userDetails.doctorEmail ||
      !userDetails.doctorPhone
    ) {
      console.log(
        `📥 Fetching user details for appointment confirmation: patientId: ${appointment.patientId}, doctorId: ${appointment.doctorId}`
      );
      const fetchedDetails = await getUserDetailsForAppointment(
        appointment.patientId,
        appointment.doctorId
      );

      userDetails = {
        ...fetchedDetails,
        ...userDetails,
      };
      console.log(`✓ User details fetched and merged`);
    }

    await RabbitMQProducer.publishAppointmentConfirmed({
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.startTime,
      status: "confirmed",
      notes: notes || "Your appointment has been confirmed by the doctor",
      ...userDetails,
    });
  } catch (error: any) {
    console.error("Error publishing appointment confirmed event:", error?.message);
    // Don't fail the confirmation if event publishing fails
  }

  return appointment;
};

export const rejectAppointmentService = async (
  appointmentId: string,
  changedBy: string,
  notes?: string,
  adoptionalData?: any
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  if (appointment.status !== "pending") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only pending appointments can be rejected");
  }

  appointment.status = "rejected";
  await appointment.save();
  await pushHistory(appointmentId, "rejected", changedBy, notes || "Appointment rejected by doctor");

  // Publish appointment rejected event to RabbitMQ
  try {
    // Prepare user details (from provided data or fetch from services)
    let userDetails = {
      doctorName: adoptionalData?.doctorName,
      patientName: adoptionalData?.patientName,
      patientEmail: adoptionalData?.patientEmail,
      patientPhone: adoptionalData?.patientPhone,
      doctorEmail: adoptionalData?.doctorEmail,
      doctorPhone: adoptionalData?.doctorPhone,
    };

    // Fetch details if not provided
    if (
      !userDetails.patientEmail ||
      !userDetails.patientPhone ||
      !userDetails.doctorEmail ||
      !userDetails.doctorPhone
    ) {
      console.log(
        `📥 Fetching user details for appointment rejection: patientId: ${appointment.patientId}, doctorId: ${appointment.doctorId}`
      );
      const fetchedDetails = await getUserDetailsForAppointment(
        appointment.patientId,
        appointment.doctorId
      );

      userDetails = {
        ...fetchedDetails,
        ...userDetails,
      };
      console.log(`✓ User details fetched and merged`);
    }

    await RabbitMQProducer.publishAppointmentRejected({
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.startTime,
      status: "rejected",
      notes: notes || "Your appointment request has been declined. Please try scheduling another time.",
      ...userDetails,
    });
  } catch (error: any) {
    console.error("Error publishing appointment rejected event:", error?.message);
    // Don't fail the rejection if event publishing fails
  }

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

export const getInternalAppointmentPaymentContextService = async (appointmentId: string) => {
  const appointment = await Appointment.findOne({ appointmentId }).select(
    "appointmentId patientId doctorId appointmentDate status paymentStatus"
  );

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  return {
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    appointmentDate: appointment.appointmentDate,
    status: appointment.status,
    paymentStatus: appointment.paymentStatus,
  };
};

export const updateInternalAppointmentPaymentStatusService = async (
  appointmentId: string,
  payload: UpdateAppointmentPaymentStatusInput,
  changedBy: string
) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  if (appointment.paymentStatus === payload.paymentStatus) {
    return appointment;
  }

  appointment.paymentStatus = payload.paymentStatus;
  await appointment.save();

  await pushHistory(
    appointment.appointmentId,
    `payment:${payload.paymentStatus}`,
    changedBy,
    payload.notes || `Payment status updated to ${payload.paymentStatus}`
  );

  return appointment;
};

const mapConfirmStatusToPaymentStatus = (
  status: ConfirmAppointmentPaymentInput["status"]
): "pending" | "paid" | "failed" | "refunded" => {
  if (status === "success") {
    return "paid";
  }

  if (status === "failed" || status === "refunded" || status === "pending") {
    return status;
  }

  return "pending";
};

export const confirmAppointmentPaymentService = async (
  payload: ConfirmAppointmentPaymentInput,
  changedBy: string
) => {
  const appointment = await Appointment.findOne({ appointmentId: payload.appointmentId });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
  }

  const mappedPaymentStatus = mapConfirmStatusToPaymentStatus(payload.status);

  appointment.paymentStatus = mappedPaymentStatus;
  await appointment.save();

  await pushHistory(
    appointment.appointmentId,
    `payment:${mappedPaymentStatus}`,
    changedBy,
    payload.notes || `Payment ${payload.paymentId} status updated to ${payload.status}`
  );

  return appointment;
};