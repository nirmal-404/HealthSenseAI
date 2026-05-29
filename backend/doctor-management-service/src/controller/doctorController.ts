import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { DoctorService } from "../service/doctorService";
import httpStatus from "http-status";
import { UnauthorizedError } from "../errors/AppError";

function doctorSvc(req: Request): DoctorService {
  return (req.app.locals as any).doctorService as DoctorService;
}

type ControllerActor = {
  id: string;
  role: string;
  email: string;
};

function getActor(req: Request): ControllerActor {
  const authUser = (req as any).authUser;
  if (authUser?.id && authUser?.role) {
    return {
      id: String(authUser.id),
      role: String(authUser.role),
      email: String(authUser.email || ""),
    };
  }

  const user = (req as any).user;
  if (user?.id && user?.role) {
    return {
      id: String(user.id),
      role: String(user.role),
      email: String(user.email || ""),
    };
  }

  throw new UnauthorizedError("Authentication required");
}

export async function postRegister(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Validate passwords match if password is provided
    if (req.body.password && req.body.confirmPassword && req.body.password !== req.body.confirmPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Passwords do not match",
      });
    }
    
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
    const specialty = String(req.query.speciality || req.query.specialty || "");
    const name = req.query.name ? String(req.query.name) : undefined;
    const results = await doctorSvc(req).searchDoctors(name, specialty);
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
      getActor(req),
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
      getActor(req),
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
    const d = await doctorSvc(req).upsertProfile(id, req.body, getActor(req));
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
      getActor(req),
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
      getActor(req),
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
      getActor(req),
    );
    return sendSuccess(res, out, "Appointment updated");
  } catch (e) {
    next(e);
  }
}

export async function getInternalBilling(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await doctorSvc(req).getInternalBilling(String(req.params.id));
    return sendSuccess(res, data, "OK");
  } catch (e) {
    next(e);
  }
}
