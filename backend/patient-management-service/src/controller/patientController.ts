import { Response } from "express";
import httpStatus from "http-status";
import Patient from "../models/Patient";
import {
  getPatientDashboardService,
  getPatientMedicalHistoryService,
  getPatientPrescriptionsService,
  registerPatientService,
  updatePatientProfileService,
  uploadPatientDocumentService,
} from "../service/patientService";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

const assertPatientAccess = async (req: XRequest, patientId: string) => {
  if (req.user?.role === "admin") {
    return;
  }

  if (!req.user?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  const patient = await Patient.findOne({ patientId }).select("userMongoId");

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  }

  if (!patient.userMongoId || patient.userMongoId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }
};

export const registerPatientController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await registerPatientService(req.body);

  const response: XResponse = {
    message: "Patient registered successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const updatePatientProfileController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = String(req.params.id);
  await assertPatientAccess(req, patientId);

  const result = await updatePatientProfileService(patientId, req.body);

  const response: XResponse = {
    message: "Patient profile updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const uploadPatientDocumentController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = String(req.params.id);
  await assertPatientAccess(req, patientId);

  const result = await uploadPatientDocumentService(patientId, req.body);

  const response: XResponse = {
    message: "Patient document uploaded successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const getPatientMedicalHistoryController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = String(req.params.id);
  await assertPatientAccess(req, patientId);

  const result = await getPatientMedicalHistoryService(patientId);

  const response: XResponse = {
    message: "Medical history fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPatientPrescriptionsController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = String(req.params.id);
  await assertPatientAccess(req, patientId);

  const result = await getPatientPrescriptionsService(patientId);

  const response: XResponse = {
    message: "Prescriptions fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPatientDashboardController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = String(req.params.id);
  await assertPatientAccess(req, patientId);

  const result = await getPatientDashboardService(patientId);

  const response: XResponse = {
    message: "Patient dashboard fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});