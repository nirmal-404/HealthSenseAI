import { Response } from "express";
import httpStatus from "http-status";
import {
  blockTimeSlotService,
  getDoctorAppointmentsService,
  getTimeSlotsService,
  registerDoctorService,
  searchDoctorsService,
  setAvailabilityService,
  updateDoctorProfileService,
} from "../service/doctorService";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

export const registerDoctorController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await registerDoctorService(req.body);

  const response: XResponse = {
    message: "Doctor registered successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const updateDoctorProfileController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await updateDoctorProfileService(String(req.params.id), req.body);

  const response: XResponse = {
    message: "Doctor profile updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const setAvailabilityController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await setAvailabilityService(String(req.params.id), req.body);

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
  const result = await blockTimeSlotService(String(req.params.id), String(req.params.slotId));

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
  const result = await getDoctorAppointmentsService(String(req.params.id));

  const response: XResponse = {
    message: "Doctor appointments fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});