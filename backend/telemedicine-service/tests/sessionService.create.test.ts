import { SESSION_STATUS } from "../src/constants";
import { ValidationError } from "../src/errors/AppError";
import { SessionRepository } from "../src/repositories/sessionRepository";
import { SessionService } from "../src/service/sessionService";

describe("SessionService.create", () => {
  const makeService = (repo: Partial<SessionRepository> = {}) =>
    new SessionService(repo as SessionRepository, {} as any, {} as any);

  const payload = {
    doctorId: "doctor-1",
    patientId: "patient-1",
    appointmentId: "appointment-1",
    appointmentType: "video" as const,
    appointmentDate: "2026-04-17T09:00:00.000Z",
    startTime: "09:00",
    endTime: "09:30",
    consultationFee: 4500,
    doctorName: "Dr. House",
    patientName: "Jane Doe",
  };

  it("returns existing appointment session when already provisioned", async () => {
    const existing = { sessionId: "session-existing" };
    const findByAppointmentId = jest.fn().mockResolvedValue(existing);
    const create = jest.fn();

    const service = makeService({
      findByAppointmentId,
      create,
    } as Partial<SessionRepository>);

    const result = await service.create(payload, {
      id: "internal-service",
      role: "admin",
    });

    expect(findByAppointmentId).toHaveBeenCalledWith(payload.appointmentId);
    expect(create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it("creates a scheduled session for a new video appointment", async () => {
    const findByAppointmentId = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockImplementation(async (doc) => ({
      ...doc,
      sessionId: doc.sessionId,
    }));

    const service = makeService({
      findByAppointmentId,
      create,
    } as Partial<SessionRepository>);

    const result = await service.create(payload, {
      id: "internal-service",
      role: "admin",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: payload.appointmentId,
        appointmentType: "video",
        status: SESSION_STATUS.SCHEDULED,
        doctorName: payload.doctorName,
        patientName: payload.patientName,
      })
    );
    expect(result.status).toBe(SESSION_STATUS.SCHEDULED);
  });

  it("returns existing session on duplicate appointment key", async () => {
    const duplicateError = {
      code: 11000,
      keyPattern: { appointmentId: 1 },
    };

    const existing = { sessionId: "session-after-duplicate" };
    const findByAppointmentId = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    const create = jest.fn().mockRejectedValue(duplicateError);

    const service = makeService({
      findByAppointmentId,
      create,
    } as Partial<SessionRepository>);

    const result = await service.create(payload, {
      id: "internal-service",
      role: "admin",
    });

    expect(result).toBe(existing);
    expect(findByAppointmentId).toHaveBeenCalledTimes(2);
  });

  it("rejects non-video appointment types", async () => {
    const service = makeService({
      findByAppointmentId: jest.fn(),
      create: jest.fn(),
    } as Partial<SessionRepository>);

    await expect(
      service.create(
        {
          ...payload,
          appointmentType: "in-person" as "video",
        },
        {
          id: "internal-service",
          role: "admin",
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
