import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { SessionService } from "../service/sessionService";

function svc(req: Request): SessionService {
  return req.app.locals.sessionService as SessionService;
}

export async function createSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const doc = await svc(req).create(req.body, req.authUser!);
    return sendSuccess(
      res,
      {
        sessionId: doc.sessionId,
        roomName: doc.roomName,
        jitsiUrl: doc.jitsiUrl,
        status: doc.status,
      },
      "Session created",
      201,
    );
  } catch (e) {
    next(e);
  }
}

export async function getSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const s = await svc(req).getById(id, req.authUser!);
    return sendSuccess(res, s, "OK");
  } catch (e) {
    next(e);
  }
}

export async function getSessionToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const token = await svc(req).getToken(id, req.authUser!);
    return sendSuccess(res, token, "OK");
  } catch (e) {
    next(e);
  }
}

export async function postStartSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const s = await svc(req).start(id, req.authUser!);
    return sendSuccess(res, s, "Session started");
  } catch (e) {
    next(e);
  }
}

export async function getSessionStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const status = await svc(req).getStatus(id, req.authUser!);
    return sendSuccess(res, status, "OK");
  } catch (e) {
    next(e);
  }
}

export async function joinSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const result = await svc(req).join(id, req.authUser!);
    return sendSuccess(res, result, "OK");
  } catch (e) {
    next(e);
  }
}

export async function endSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const s = await svc(req).end(id, req.body, req.authUser!);
    return sendSuccess(res, s, "Session ended");
  } catch (e) {
    next(e);
  }
}

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id);
    const data = await svc(req).getSummary(id, req.authUser!);
    return sendSuccess(res, data, "OK");
  } catch (e) {
    next(e);
  }
}

export async function listDoctorSessions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = req.query as unknown as { page: number; limit: number };
    const page = q.page;
    const limit = q.limit;
    const doctorId = String(req.params.doctorId);
    const { items, total } = await svc(req).listForDoctor(
      doctorId,
      page,
      limit,
      req.authUser!,
    );
    return sendSuccess(res, { items, page, limit, total }, "OK");
  } catch (e) {
    next(e);
  }
}
