export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type AppointmentStatusFilter = AppointmentStatus | 'all';

export type AppointmentType = 'video' | 'in-person';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  symptoms?: string;
  consultationNotes?: string;
  consultationFee: number;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentFilterQuery {
  status?: AppointmentStatusFilter;
  date?: string;
}

export interface BookAppointmentPayload {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorEmail?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: AppointmentType;
  symptoms?: string;
}

export interface RescheduleAppointmentPayload {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface AppointmentStatusResponse {
  appointmentId: string;
  status: AppointmentStatus;
  updatedAt: string;
}

export interface DoctorSearchParams {
  name?: string;
  specialty?: string;
  limit?: number;
}

export interface DoctorRecord {
  doctorId?: string;
  id?: string;
  _id?: string;
  userId?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  specialization?: string;
  email?: string;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialization?: string;
  email?: string;
}

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}
