import { randomUUID } from "crypto";
import { SESSION_STATUS, EVENT_CHANNELS } from "../constants";
import { ForbiddenError, NotFoundError } from "../errors/AppError";
import { SessionRepository } from "../repositories/sessionRepository";
import { AuthUser } from "../middlewares/auth";
import { CONFIG } from "../config/envConfig";
import { SessionPipelineService } from "./sessionPipelineService";
import type { IEventPublisher } from "./interfaces";
import { ISession } from "../models/Session";

/**
 * Session lifecycle and authorization for telemedicine.
 */
export class SessionService {
  constructor(
    private readonly repo: SessionRepository,
    private readonly pipeline: SessionPipelineService,
    private readonly events: IEventPublisher,
  ) {}

  private assertAccess(session: ISession, user: AuthUser) {
    const role = user.role?.toLowerCase() || "";
    if (role === "admin") return;
    const isDoctor = role === "doctor";
    const isPatient = role === "patient";
    if (isDoctor && session.doctorId !== user.id) {
      throw new ForbiddenError("Cannot access another doctor's session");
    }
    if (isPatient && session.patientId !== user.id) {
      throw new ForbiddenError("Cannot access another patient's session");
    }
  }

  /** Creates a Jitsi-backed session record. */
  async create(
    input: { doctorId: string; patientId: string; appointmentId?: string },
    user: AuthUser,
  ) {
    this.assertActorCanCreate(input, user);
    const sessionId = randomUUID();
    const roomName = `HealthSense_${sessionId.replace(/-/g, "")}`;
    const domain = CONFIG.JITSI_PUBLIC_DOMAIN;
    const jitsiUrl = `https://${domain}/${roomName}`;
    return this.repo.create({
      sessionId,
      appointmentId: input.appointmentId,
      doctorId: input.doctorId,
      patientId: input.patientId,
      roomName,
      jitsiUrl,
      status: SESSION_STATUS.ACTIVE,
    });
  }

  private assertActorCanCreate(
    input: { doctorId: string; patientId: string },
    user: AuthUser,
  ) {
    const r = user.role?.toLowerCase() || "";
    if (r === "admin") return;
    if (r === "doctor" && user.id !== input.doctorId) {
      throw new ForbiddenError("Doctor can only create own sessions");
    }
    if (r === "patient" && user.id !== input.patientId) {
      throw new ForbiddenError("Patient mismatch");
    }
  }

  /** Returns one session if authorized. */
  async getById(sessionId: string, user: AuthUser) {
    const s = await this.repo.findBySessionId(sessionId);
    if (!s) throw new NotFoundError("Session not found");
    this.assertAccess(s, user);
    return s;
  }

  async getToken(sessionId: string, user: AuthUser) {
    const s = await this.getById(sessionId, user);
    return {
      sessionId: s.sessionId,
      roomName: s.roomName,
      jitsiUrl: s.jitsiUrl,
      status: s.status,
    };
  }

  async start(sessionId: string, user: AuthUser) {
    const s = await this.getById(sessionId, user);
    if (s.status === SESSION_STATUS.COMPLETED) {
      throw new ForbiddenError("Cannot restart a completed session");
    }
    if (s.status === SESSION_STATUS.ACTIVE) {
      return s;
    }
    const updated = await this.repo.updateBySessionId(sessionId, {
      status: SESSION_STATUS.ACTIVE,
      startedAt: s.startedAt || new Date(),
    });
    if (!updated) throw new NotFoundError("Session not found");
    return updated;
  }

  async getStatus(sessionId: string, user: AuthUser) {
    const s = await this.getById(sessionId, user);
    return {
      sessionId: s.sessionId,
      status: s.status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
    };
  }

  async join(sessionId: string, user: AuthUser) {
    const s = await this.getById(sessionId, user);
    return {
      sessionId: s.sessionId,
      roomName: s.roomName,
      jitsiUrl: s.jitsiUrl,
      status: s.status,
    };
  }

  /** Marks session ended and kicks off summarization pipeline. */
  async end(
    sessionId: string,
    body: { recordingUrl?: string },
    user: AuthUser,
  ) {
    const s = await this.repo.findBySessionId(sessionId);
    if (!s) throw new NotFoundError("Session not found");
    this.assertAccess(s, user);
    const updated = await this.repo.updateBySessionId(sessionId, {
      status: SESSION_STATUS.COMPLETED,
      endedAt: new Date(),
      recordingUrl: body.recordingUrl,
      startedAt: s.startedAt || new Date(),
    });
    if (!updated) throw new NotFoundError("Session not found");
    await this.events.publish(EVENT_CHANNELS.SESSION_ENDED, {
      sessionId,
      doctorId: s.doctorId,
      patientId: s.patientId,
      appointmentId: s.appointmentId,
    });
    void this.pipeline.run(sessionId).catch(() => undefined);
    return updated;
  }

  /** Returns stored SOAP summary when ready. */
  async getSummary(sessionId: string, user: AuthUser) {
    const s = await this.getById(sessionId, user);
    return {
      summaryStatus: s.summaryStatus,
      soapNote: s.soapNote,
      transcript: s.transcript,
      error: s.summaryError,
    };
  }

  /** Paginated history for a doctor. */
  async listForDoctor(
    doctorId: string,
    page: number,
    limit: number,
    user: AuthUser,
  ) {
    const role = user.role?.toLowerCase() || "";
    if (role === "doctor" && user.id !== doctorId) {
      throw new ForbiddenError("Cannot list another doctor's sessions");
    }
    return this.repo.listByDoctor(doctorId, page, limit);
  }
}
