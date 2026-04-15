import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { PrescriptionService } from "../service/prescriptionService";

function rxSvc(req: Request): PrescriptionService {
  return (req.app.locals as any).prescriptionService as PrescriptionService;
}

export async function createPrescription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await rxSvc(req).create(req.body, req.authUser!);
    return sendSuccess(res, data, "Prescription issued", 201);
  } catch (e) {
    next(e);
  }
}

export async function getPrescription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const data = await rxSvc(req).getById(id, req.authUser!);
    return sendSuccess(res, data, "OK");
  } catch (e) {
    next(e);
  }
}

export async function listPrescriptionsByDoctor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = req.query as unknown as { page: number; limit: number };
    const doctorId = String(req.params.doctorId);
    const { items, total } = await rxSvc(req).listByDoctor(
      doctorId,
      q.page,
      q.limit,
      req.authUser!,
    );
    return sendSuccess(res, { items, page: q.page, limit: q.limit, total }, "OK");
  } catch (e) {
    next(e);
  }
}

export async function verifyPrescription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = String(req.params.token);
    const data = await rxSvc(req).verifyPublic(token);
    return sendSuccess(res, data, data.valid ? "OK" : "Verification failed");
  } catch (e) {
    next(e);
  }
}
