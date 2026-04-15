import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { DoctorService } from "../service/doctorService";

function doctorSvc(req: Request): DoctorService {
  return (req.app.locals as any).doctorService as DoctorService;
}

export async function postRegister(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const d = await doctorSvc(req).registerProfile(req.body);
    return sendSuccess(res, d, "Doctor registered", 201);
  } catch (e) {
    next(e);
  }
}

export async function searchDoctors(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const specialty = String(req.query.specialty);
    const results = await doctorSvc(req).searchBySpecialty(specialty);
    return sendSuccess(res, results, "OK");
  } catch (e) {
    next(e);
  }
}

export async function postAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return putAvailability(req, res, next);
}

export async function getTimeSlots(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slots = await doctorSvc(req).getTimeSlots(String(req.params.id));
    return sendSuccess(res, slots, "OK");
  } catch (e) {
    next(e);
  }
}

export async function blockTimeSlot(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const doctorId = String(req.params.id);
    const slotId = String(req.params.slotId);
    const updated = await doctorSvc(req).blockTimeSlot(
      doctorId,
      slotId,
      req.authUser!,
    );
    return sendSuccess(res, updated, "Time slot blocked");
  } catch (e) {
    next(e);
  }
}

export async function getAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await doctorSvc(req).listAppointments(
      String(req.params.id),
      req.authUser!,
    );
    return sendSuccess(res, data, "OK");
  } catch (e) {
    next(e);
  }
}

export async function getDoctor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const d = await doctorSvc(req).getProfile(String(req.params.id));
    return sendSuccess(res, d, "OK");
  } catch (e) {
    next(e);
  }
}

export async function putDoctor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const d = await doctorSvc(req).upsertProfile(id, req.body, req.authUser!);
    return sendSuccess(res, d, "Profile saved");
  } catch (e) {
    next(e);
  }
}

export async function getAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const a = await doctorSvc(req).getAvailability(String(req.params.id));
    return sendSuccess(res, a, "OK");
  } catch (e) {
    next(e);
  }
}

export async function putAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const d = await doctorSvc(req).setAvailability(
      id,
      req.body.weeklySlots,
      req.body.blockedDates,
      req.authUser!,
    );
    return sendSuccess(res, d, "Availability updated");
  } catch (e) {
    next(e);
  }
}

export async function patientReports(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = req.headers.authorization;
    const data = await doctorSvc(req).patientReports(
      String(req.params.doctorId),
      String(req.params.patientId),
      req.authUser!,
      auth,
    );
    return sendSuccess(res, data, "OK");
  } catch (e) {
    next(e);
  }
}

export async function respondAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const out = await doctorSvc(req).respondAppointment(
      String(req.params.id),
      req.body.action,
      req.authUser!,
    );
    return sendSuccess(res, out, "Appointment updated");
  } catch (e) {
    next(e);
  }
}

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
