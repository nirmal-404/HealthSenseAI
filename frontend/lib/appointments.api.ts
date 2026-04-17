import api from '@/lib/api';
import type {
  ApiEnvelope,
  Appointment,
  AppointmentFilterQuery,
  AppointmentStatusResponse,
  BookAppointmentPayload,
  DoctorOption,
  DoctorRecord,
  DoctorSearchParams,
  RescheduleAppointmentPayload,
} from '@/lib/appointments.types';

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data?.data;

const normalizeDoctorOption = (doctor: DoctorRecord): DoctorOption | null => {
  if (doctor.role && doctor.role !== 'doctor') {
    return null;
  }

  const id = doctor.doctorId || doctor.id || doctor._id || doctor.userId || '';
  if (!id) {
    return null;
  }

  const firstName = doctor.firstName || '';
  const lastName = doctor.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id,
    name: fullName || doctor.name || `Doctor ${id.slice(0, 6)}`,
    specialization: doctor.specialization,
    email: doctor.email,
  };
};

export async function getPatientAppointments(
  patientId: string,
  filter: AppointmentFilterQuery = {}
): Promise<Appointment[]> {
  const params: Record<string, string> = {};

  if (filter.status && filter.status !== 'all') {
    params.status = filter.status;
  }

  if (filter.date) {
    params.date = filter.date;
  }

  const response = await api.get<ApiEnvelope<Appointment[]>>(`/appointments/patient/${patientId}`, {
    params,
  });

  return unwrap(response) || [];
}

export async function getDoctorAppointments(
  doctorId: string,
  filter: AppointmentFilterQuery = {}
): Promise<Appointment[]> {
  const params: Record<string, string> = {};

  if (filter.status && filter.status !== 'all') {
    params.status = filter.status;
  }

  if (filter.date) {
    params.date = filter.date;
  }

  const response = await api.get<ApiEnvelope<Appointment[]>>(`/appointments/doctor/${doctorId}`, {
    params,
  });

  return unwrap(response) || [];
}

export async function getAppointmentById(appointmentId: string): Promise<Appointment> {
  const response = await api.get<ApiEnvelope<Appointment>>(`/appointments/${appointmentId}`);
  return unwrap(response);
}

export async function getAppointmentStatus(appointmentId: string): Promise<AppointmentStatusResponse> {
  const response = await api.get<ApiEnvelope<AppointmentStatusResponse>>(
    `/appointments/${appointmentId}/status`
  );
  return unwrap(response);
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  const response = await api.post<ApiEnvelope<Appointment>>('/appointments/book', payload);
  return unwrap(response);
}

export async function rescheduleAppointment(
  appointmentId: string,
  payload: RescheduleAppointmentPayload
): Promise<Appointment> {
  const response = await api.put<ApiEnvelope<Appointment>>(
    `/appointments/${appointmentId}/reschedule`,
    payload
  );
  return unwrap(response);
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  const response = await api.delete<ApiEnvelope<Appointment>>(`/appointments/${appointmentId}/cancel`);
  return unwrap(response);
}

export async function confirmAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
  const response = await api.put<ApiEnvelope<Appointment>>(`/appointments/${appointmentId}/confirm`, {
    notes: notes ?? '',
  });
  return unwrap(response);
}

export async function approveAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
  const response = await api.put<ApiEnvelope<Appointment>>(`/appointments/${appointmentId}/approve`, {
    notes: notes ?? '',
  });
  return unwrap(response);
}

export async function rejectAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
  const response = await api.put<ApiEnvelope<Appointment>>(`/appointments/${appointmentId}/reject`, {
    notes: notes ?? '',
  });
  return unwrap(response);
}

export async function reopenAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
  const response = await api.put<ApiEnvelope<Appointment>>(`/appointments/${appointmentId}/reopen`, {
    notes: notes ?? '',
  });
  return unwrap(response);
}

export async function searchDoctors(params: DoctorSearchParams = {}): Promise<DoctorOption[]> {
  const query: Record<string, string> = {};

  if (params.name?.trim()) {
    query.name = params.name.trim();
  }

  if (params.limit) {
    query.limit = String(params.limit);
  }

  try {
    const response = await api.get<ApiEnvelope<DoctorRecord[]>>('/auth/doctors', {
      params: query,
    });

    const doctors = unwrap(response) || [];
    return doctors
      .map(normalizeDoctorOption)
      .filter((doctor): doctor is DoctorOption => Boolean(doctor));
  } catch {
    const legacyResponse = await api.get<ApiEnvelope<DoctorRecord[]>>('/doctors/search', {
      params: params.specialty?.trim()
        ? {
            ...query,
            specialty: params.specialty.trim(),
          }
        : query,
    });

    const doctors = unwrap(legacyResponse) || [];
    return doctors
      .map(normalizeDoctorOption)
      .filter((doctor): doctor is DoctorOption => Boolean(doctor));
  }
}
