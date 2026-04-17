import api from '@/lib/api';
import type {
  CreateTelemedicineSessionPayload,
  EndTelemedicineSessionPayload,
  PaginatedTelemedicineSessions,
  TelemedicineApiEnvelope,
  TelemedicinePaginationQuery,
  TelemedicineSession,
  TelemedicineSessionAccess,
  TelemedicineSessionStatusResponse,
  TelemedicineSessionSummaryResponse,
} from '@/lib/telemedicine.types';

const unwrap = <T>(response: { data: TelemedicineApiEnvelope<T> }) => response.data?.data;

export async function createTelemedicineSession(
  payload: CreateTelemedicineSessionPayload
): Promise<TelemedicineSessionAccess> {
  const response = await api.post<TelemedicineApiEnvelope<TelemedicineSessionAccess>>(
    '/telemedicine/sessions/create',
    payload
  );
  return unwrap(response);
}

export async function getTelemedicineSession(sessionId: string): Promise<TelemedicineSession> {
  const response = await api.get<TelemedicineApiEnvelope<TelemedicineSession>>(
    `/telemedicine/sessions/${sessionId}`
  );
  return unwrap(response);
}

export async function getTelemedicineSessionToken(sessionId: string): Promise<TelemedicineSessionAccess> {
  const response = await api.get<TelemedicineApiEnvelope<TelemedicineSessionAccess>>(
    `/telemedicine/sessions/${sessionId}/token`
  );
  return unwrap(response);
}

export async function startTelemedicineSession(sessionId: string): Promise<TelemedicineSession> {
  const response = await api.post<TelemedicineApiEnvelope<TelemedicineSession>>(
    `/telemedicine/sessions/${sessionId}/start`
  );
  return unwrap(response);
}

export async function getTelemedicineSessionStatus(
  sessionId: string
): Promise<TelemedicineSessionStatusResponse> {
  const response = await api.get<TelemedicineApiEnvelope<TelemedicineSessionStatusResponse>>(
    `/telemedicine/sessions/${sessionId}/status`
  );
  return unwrap(response);
}

export async function joinTelemedicineSession(sessionId: string): Promise<TelemedicineSessionAccess> {
  const response = await api.post<TelemedicineApiEnvelope<TelemedicineSessionAccess>>(
    `/telemedicine/sessions/${sessionId}/join`
  );
  return unwrap(response);
}

export async function endTelemedicineSession(
  sessionId: string,
  payload: EndTelemedicineSessionPayload = {}
): Promise<TelemedicineSession> {
  const response = await api.patch<TelemedicineApiEnvelope<TelemedicineSession>>(
    `/telemedicine/sessions/${sessionId}/end`,
    payload
  );
  return unwrap(response);
}

export async function getTelemedicineSessionSummary(
  sessionId: string
): Promise<TelemedicineSessionSummaryResponse> {
  const response = await api.get<TelemedicineApiEnvelope<TelemedicineSessionSummaryResponse>>(
    `/telemedicine/sessions/${sessionId}/summary`
  );
  return unwrap(response);
}

export async function listDoctorTelemedicineSessions(
  doctorId: string,
  query: TelemedicinePaginationQuery = {}
): Promise<PaginatedTelemedicineSessions> {
  const response = await api.get<TelemedicineApiEnvelope<PaginatedTelemedicineSessions>>(
    `/telemedicine/sessions/doctor/${doctorId}`,
    {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
    }
  );
  return unwrap(response);
}

export async function listPatientTelemedicineSessions(
  patientId: string,
  query: TelemedicinePaginationQuery = {}
): Promise<PaginatedTelemedicineSessions> {
  const response = await api.get<TelemedicineApiEnvelope<PaginatedTelemedicineSessions>>(
    `/telemedicine/sessions/patient/${patientId}`,
    {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
    }
  );
  return unwrap(response);
}
