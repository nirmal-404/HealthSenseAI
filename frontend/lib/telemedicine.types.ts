export type TelemedicineSessionStatus = 'scheduled' | 'active' | 'completed' | 'failed';

export type TelemedicineSummaryStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'skipped'
  | 'failed';

export interface TelemedicineSoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpDate: string | null;
  urgencyLevel: 'low' | 'medium' | 'high';
}

export interface TelemedicineSession {
  _id?: string;
  sessionId: string;
  appointmentId?: string;
  appointmentType?: 'video' | 'in-person';
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  consultationFee?: number;
  doctorName?: string;
  patientName?: string;
  doctorId: string;
  patientId: string;
  roomName: string;
  jitsiUrl: string;
  status: TelemedicineSessionStatus;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  transcript?: string;
  soapNote?: TelemedicineSoapNote;
  summaryStatus?: TelemedicineSummaryStatus;
  summaryError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TelemedicineSessionAccess {
  sessionId: string;
  roomName: string;
  jitsiUrl: string;
  status: TelemedicineSessionStatus;
}

export interface TelemedicineSessionStatusResponse {
  sessionId: string;
  status: TelemedicineSessionStatus;
  startedAt?: string;
  endedAt?: string;
}

export interface TelemedicineSessionSummaryResponse {
  summaryStatus: TelemedicineSummaryStatus;
  soapNote?: TelemedicineSoapNote;
  transcript?: string;
  error?: string;
}

export interface CreateTelemedicineSessionPayload {
  doctorId: string;
  patientId: string;
  appointmentId: string;
  appointmentType: 'video';
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  consultationFee?: number;
  doctorName?: string;
  patientName?: string;
}

export interface EndTelemedicineSessionPayload {
  recordingUrl?: string;
}

export interface TelemedicinePaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedTelemedicineSessions {
  items: TelemedicineSession[];
  page: number;
  limit: number;
  total: number;
}

export interface TelemedicineApiEnvelope<T> {
  success?: boolean;
  message: string;
  data: T;
}
