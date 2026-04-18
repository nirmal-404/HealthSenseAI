import { Response } from "express";
import httpStatus from "http-status";
import Patient from "../models/Patient";
import {
  createPrescriptionService,
  deletePrescriptionService,
  getDoctorPrescriptionsService,
  createPatientProfileService,
  getPatientDashboardService,
  getInternalPatientIdentityService,
  getPatientMedicalHistoryService,
  getPrescriptionByIdService,
  getPrescriptionDocumentService,
  getPatientPrescriptionsService,
  updatePrescriptionService,
  updatePatientProfileService,
  uploadPatientDocumentService,
} from "../service/patientService";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { XRequest } from "../types/XRequest";
import { XResponse } from "../types/XResponse";

const findPatientByIdentifier = (identifier: string) =>
  Patient.findOne({
    $or: [{ patientId: identifier }, { userMongoId: identifier }],
  });

const assertPatientAccess = async (req: XRequest, patientIdentifier: string) => {
  const patient = await findPatientByIdentifier(patientIdentifier).select(
    "patientId userMongoId"
  );

  if (!patient) {
    if (
      req.user?.role === "patient" &&
      req.user?.id &&
      req.user.id === patientIdentifier
    ) {
      return patientIdentifier;
    }

    throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  }

  if (req.user?.role === "admin" || req.user?.role === "doctor") {
    return patient.patientId;
  }

  if (!req.user?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  if (!patient.userMongoId || patient.userMongoId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }

  return patient.patientId;
};

const assertPrescriptionAccess = async (
  req: XRequest,
  prescription: { patientId: string; doctorId: string }
) => {
  const role = req.user?.role;

  if (role === "admin") {
    return;
  }

  if (role === "doctor") {
    if (req.user?.id !== prescription.doctorId) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
    }
    return;
  }

  if (role === "patient") {
    if (!req.user?.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
    }

    const patient = await findPatientByIdentifier(prescription.patientId).select(
      "userMongoId"
    );

    if (!patient) {
      if (req.user.id === prescription.patientId) {
        return;
      }

      throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
    }

    if (!patient.userMongoId || patient.userMongoId !== req.user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
    }

    return;
  }

  throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
};

export const createPatientProfileController = catchAsync(async (req: XRequest, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  const result = await createPatientProfileService(req.user.id, req.body);

  const response: XResponse = {
    message: "Patient profile created successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const updatePatientProfileController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = await assertPatientAccess(req, String(req.params.id));

  const result = await updatePatientProfileService(patientId, req.body);

  const response: XResponse = {
    message: "Patient profile updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const uploadPatientDocumentController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = await assertPatientAccess(req, String(req.params.id));

  const result = await uploadPatientDocumentService(patientId, req.body);

  const response: XResponse = {
    message: "Patient document uploaded successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const getPatientMedicalHistoryController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = await assertPatientAccess(req, String(req.params.id));

  const result = await getPatientMedicalHistoryService(patientId);

  const response: XResponse = {
    message: "Medical history fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPatientPrescriptionsController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = await assertPatientAccess(req, String(req.params.id));

  const result = await getPatientPrescriptionsService(patientId, {
    doctorId: req.query.doctorId ? String(req.query.doctorId) : undefined,
    dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
    dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
  });

  const response: XResponse = {
    message: "Prescriptions fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const createPrescriptionController = catchAsync(async (req: XRequest, res: Response) => {
  if (!req.user?.id || !req.user?.role) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  const result = await createPrescriptionService(req.body, {
    id: req.user.id,
    role: req.user.role,
  });

  const response: XResponse = {
    message: "Prescription created successfully",
    data: result,
  };

  res.status(httpStatus.CREATED).send(response);
});

export const getDoctorPrescriptionsController = catchAsync(async (req: XRequest, res: Response) => {
  const doctorId = String(req.params.doctorId);

  if (req.user?.role === "doctor" && req.user?.id !== doctorId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Access denied");
  }

  const result = await getDoctorPrescriptionsService(doctorId, {
    patientId: req.query.patientId ? String(req.query.patientId) : undefined,
    dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
    dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
  });

  const response: XResponse = {
    message: "Doctor prescriptions fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getPrescriptionByIdController = catchAsync(async (req: XRequest, res: Response) => {
  const prescriptionId = String(req.params.prescriptionId);
  const result = await getPrescriptionByIdService(prescriptionId);
  await assertPrescriptionAccess(req, result);

  const response: XResponse = {
    message: "Prescription fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const updatePrescriptionController = catchAsync(async (req: XRequest, res: Response) => {
  if (!req.user?.id || !req.user?.role) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  const result = await updatePrescriptionService(String(req.params.prescriptionId), req.body, {
    id: req.user.id,
    role: req.user.role,
  });

  const response: XResponse = {
    message: "Prescription updated successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const deletePrescriptionController = catchAsync(async (req: XRequest, res: Response) => {
  if (!req.user?.id || !req.user?.role) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized: Not logged in");
  }

  const result = await deletePrescriptionService(String(req.params.prescriptionId), {
    id: req.user.id,
    role: req.user.role,
  });

  const response: XResponse = {
    message: "Prescription deleted successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const downloadPrescriptionController = catchAsync(async (req: XRequest, res: Response) => {
  const prescriptionId = String(req.params.prescriptionId);
  const { prescription, pdfBuffer } = await getPrescriptionDocumentService(prescriptionId);
  await assertPrescriptionAccess(req, prescription);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="prescription-${prescriptionId}.pdf"`
  );

  res.status(httpStatus.OK).send(pdfBuffer);
});

export const getPatientDashboardController = catchAsync(async (req: XRequest, res: Response) => {
  const patientId = await assertPatientAccess(req, String(req.params.id));

  const result = await getPatientDashboardService(patientId);

  const response: XResponse = {
    message: "Patient dashboard fetched successfully",
    data: result,
  };

  res.status(httpStatus.OK).send(response);
});

export const getInternalPatientIdentityController = catchAsync(
  async (req: XRequest, res: Response) => {
    const result = await getInternalPatientIdentityService(String(req.params.id));

    const response: XResponse = {
      message: "Patient identity fetched successfully",
      data: result,
    };

    res.status(httpStatus.OK).send(response);
  }
);