import { SessionModel, ISession } from "../models/Session";

/**
 * Data access for video sessions (no business rules).
 */
export class SessionRepository {
  async create(doc: Partial<ISession>): Promise<ISession> {
    return SessionModel.create(doc);
  }

  async findBySessionId(sessionId: string): Promise<ISession | null> {
    return SessionModel.findOne({ sessionId });
  }

  async findByAppointmentId(appointmentId: string): Promise<ISession | null> {
    return SessionModel.findOne({ appointmentId });
  }

  async updateBySessionId(
    sessionId: string,
    patch: Partial<ISession>,
  ): Promise<ISession | null> {
    return SessionModel.findOneAndUpdate({ sessionId }, patch, {
      new: true,
    });
  }

  async listByDoctor(
    doctorId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ISession[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SessionModel.find({ doctorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SessionModel.countDocuments({ doctorId }),
    ]);
    return { items, total };
  }

  async listByPatient(
    patientId: string,
    page: number,
    limit: number,
  ): Promise<{ items: ISession[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SessionModel.find({ patientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SessionModel.countDocuments({ patientId }),
    ]);
    return { items, total };
  }
}
