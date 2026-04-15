import { Response } from "express";
import httpStatus from "http-status";
import {
  getAnalyticsService,
  getPendingVerificationService,
  getReportsService,
  getTransactionsService,
  getUsersService,
  updateUserStatusService,
  verifyDoctorService,
} from "../service/adminService";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

export const getUsersController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getUsersService();

  const response: XResponse = {
    message: "Users fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const updateUserStatusController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await updateUserStatusService(
    String(req.params.userId),
    req.body,
    req.user?.id || "system"
  );

  const response: XResponse = {
    message: "User status updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPendingVerificationController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getPendingVerificationService();

  const response: XResponse = {
    message: "Pending doctor verifications fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const verifyDoctorController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await verifyDoctorService(
    String(req.params.doctorId),
    req.body,
    req.user?.id || "system"
  );

  const response: XResponse = {
    message: "Doctor verification updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getAnalyticsController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getAnalyticsService();

  const response: XResponse = {
    message: "Analytics fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getTransactionsController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getTransactionsService();

  const response: XResponse = {
    message: "Transactions fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getReportsController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getReportsService();

  const response: XResponse = {
    message: "Reports generated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});