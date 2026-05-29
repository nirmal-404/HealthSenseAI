import { ForbiddenError } from '../src/errors/AppError';
import { SessionRepository } from '../src/repositories/sessionRepository';
import { SessionService } from '../src/service/sessionService';

describe('SessionService.listForPatient', () => {
  const makeService = (
    repo: Partial<SessionRepository> = {}
  ) => {
    return new SessionService(
      repo as SessionRepository,
      {} as any,
      {} as any,
    );
  };

  it('allows patient to list own sessions', async () => {
    const listByPatient = jest.fn().mockResolvedValue({
      items: [{ sessionId: 's-1' }],
      total: 1,
    });
    const service = makeService({ listByPatient } as Partial<SessionRepository>);

    const result = await service.listForPatient('patient-1', 1, 10, {
      id: 'patient-1',
      role: 'patient',
    });

    expect(listByPatient).toHaveBeenCalledWith('patient-1', 1, 10);
    expect(result).toEqual({
      items: [{ sessionId: 's-1' }],
      total: 1,
    });
  });

  it('rejects patient listing another patient sessions', async () => {
    const listByPatient = jest.fn();
    const service = makeService({ listByPatient } as Partial<SessionRepository>);

    await expect(
      service.listForPatient('patient-2', 1, 10, {
        id: 'patient-1',
        role: 'patient',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(listByPatient).not.toHaveBeenCalled();
  });

  it('rejects doctor listing sessions by patient', async () => {
    const listByPatient = jest.fn();
    const service = makeService({ listByPatient } as Partial<SessionRepository>);

    await expect(
      service.listForPatient('patient-1', 1, 10, {
        id: 'doctor-1',
        role: 'doctor',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(listByPatient).not.toHaveBeenCalled();
  });

  it('allows admin to list patient sessions', async () => {
    const listByPatient = jest.fn().mockResolvedValue({ items: [], total: 0 });
    const service = makeService({ listByPatient } as Partial<SessionRepository>);

    const result = await service.listForPatient('patient-1', 2, 5, {
      id: 'admin-1',
      role: 'admin',
    });

    expect(listByPatient).toHaveBeenCalledWith('patient-1', 2, 5);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
