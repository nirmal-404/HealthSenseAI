import { Response } from "express";
import httpStatus from "http-status";
import {
  bookAppointmentService,
  cancelAppointmentService,
  confirmAppointmentService,
  getAppointmentService,
  getAppointmentsByDoctorService,
  getAppointmentsByPatientService,
  getAppointmentStatusService,
  rejectAppointmentService,
  rescheduleAppointmentService,
} from "../service/appointmentService";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

export const bookAppointmentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await bookAppointmentService(req.body, req.user?.id || "system");

  const response: XResponse = {
    message: "Appointment booked successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const getAppointmentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getAppointmentService(String(req.params.id));

  const response: XResponse = {
    message: "Appointment fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const rescheduleAppointmentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await rescheduleAppointmentService(
    String(req.params.id),
    req.body,
    req.user?.id || "system"
  );

  const response: XResponse = {
    message: "Appointment rescheduled successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const cancelAppointmentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await cancelAppointmentService(String(req.params.id), req.user?.id || "system");

  const response: XResponse = {
    message: "Appointment cancelled successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const confirmAppointmentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await confirmAppointmentService(
    String(req.params.id),
    req.user?.id || "system",
    req.body?.notes
  );

  const response: XResponse = {
    message: "Appointment confirmed successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const rejectAppointmentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await rejectAppointmentService(
    String(req.params.id),
    req.user?.id || "system",
    req.body?.notes
  );

  const response: XResponse = {
    message: "Appointment rejected successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getAppointmentsByPatientController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getAppointmentsByPatientService(String(req.params.patientId), {
    status: req.query.status as string | undefined,
    date: req.query.date ? new Date(String(req.query.date)) : undefined,
  });

  const response: XResponse = {
    message: "Patient appointments fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getAppointmentsByDoctorController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getAppointmentsByDoctorService(String(req.params.doctorId), {
    status: req.query.status as string | undefined,
    date: req.query.date ? new Date(String(req.query.date)) : undefined,
  });

  const response: XResponse = {
    message: "Doctor appointments fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getAppointmentStatusController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getAppointmentStatusService(String(req.params.id));

  const response: XResponse = {
    message: "Appointment status fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});