import { Response } from "express";
import httpStatus from "http-status";
import Doctor from "../models/Doctor";
import {
  blockTimeSlotService,
  getDoctorAppointmentsService,
  getInternalDoctorBillingService,
  getTimeSlotsService,
  registerDoctorService,
  searchDoctorsService,
  setAvailabilityService,
  updateDoctorProfileService,
} from "../service/doctorService";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

const assertDoctorAccess = async (req: XRequest, doctorId: string) => {
  if (req.user?.role === "admin") {
    return;
  }

  if (!req.user?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  const doctor = await Doctor.findOne({ doctorId }).select("userMongoId");

  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
  }

  if (!doctor.userMongoId || doctor.userMongoId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }
};

export const registerDoctorController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await registerDoctorService(req.body);

  const response: XResponse = {
    message: "Doctor registered successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const updateDoctorProfileController = catchAsync(async (req: XRequest, res: Response) => {
  const doctorId = String(req.params.id);
  await assertDoctorAccess(req, doctorId);

  const result = await updateDoctorProfileService(doctorId, req.body);

  const response: XResponse = {
    message: "Doctor profile updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const setAvailabilityController = catchAsync(async (req: XRequest, res: Response) => {
  const doctorId = String(req.params.id);
  await assertDoctorAccess(req, doctorId);

  const result = await setAvailabilityService(doctorId, req.body);

  const response: XResponse = {
    message: "Doctor availability updated successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const getTimeSlotsController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getTimeSlotsService(String(req.params.id), {
    status: req.query.status as string | undefined,
    date: req.query.date ? new Date(String(req.query.date)) : undefined,
  });

  const response: XResponse = {
    message: "Time slots fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const blockTimeSlotController = catchAsync(async (req: XRequest, res: Response) => {
  const doctorId = String(req.params.id);
  await assertDoctorAccess(req, doctorId);

  const result = await blockTimeSlotService(doctorId, String(req.params.slotId));

  const response: XResponse = {
    message: "Time slot blocked successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const searchDoctorController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await searchDoctorsService({
    specialty: req.query.specialty as string | undefined,
    name: req.query.name as string | undefined,
  });

  const response: XResponse = {
    message: "Doctors fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getDoctorAppointmentsController = catchAsync(async (req: XRequest, res: Response) => {
  const doctorId = String(req.params.id);
  await assertDoctorAccess(req, doctorId);

  const result = await getDoctorAppointmentsService(doctorId);

  const response: XResponse = {
    message: "Doctor appointments fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getInternalDoctorBillingController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getInternalDoctorBillingService(String(req.params.id));

  const response: XResponse = {
    message: "Doctor billing details fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});