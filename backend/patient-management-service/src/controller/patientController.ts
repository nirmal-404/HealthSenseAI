import { Response } from "express";
import httpStatus from "http-status";
import {
  getPatientDashboardService,
  getPatientMedicalHistoryService,
  getPatientPrescriptionsService,
  registerPatientService,
  updatePatientProfileService,
  uploadPatientDocumentService,
} from "../service/patientService";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

export const registerPatientController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await registerPatientService(req.body);

  const response: XResponse = {
    message: "Patient registered successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const updatePatientProfileController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await updatePatientProfileService(String(req.params.id), req.body);

  const response: XResponse = {
    message: "Patient profile updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const uploadPatientDocumentController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await uploadPatientDocumentService(String(req.params.id), req.body);

  const response: XResponse = {
    message: "Patient document uploaded successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const getPatientMedicalHistoryController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getPatientMedicalHistoryService(String(req.params.id));

  const response: XResponse = {
    message: "Medical history fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPatientPrescriptionsController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getPatientPrescriptionsService(String(req.params.id));

  const response: XResponse = {
    message: "Prescriptions fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPatientDashboardController = catchAsync(async (req: XRequest, res: Response) => {
  const result = await getPatientDashboardService(String(req.params.id));

  const response: XResponse = {
    message: "Patient dashboard fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});