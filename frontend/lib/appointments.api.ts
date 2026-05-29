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
    specialization: doctor.specialization || doctor.speciality,
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

  const doctorServiceParams = {
    ...query,
    ...(params.specialty?.trim() ? { specialty: params.specialty.trim() } : {}),
  };

  try {
    // Primary source: user-service doctors list (historically complete/canonical for booking).
    const authResponse = await api.get<ApiEnvelope<DoctorRecord[]>>('/auth/doctors', {
      params: query,
    });

    const authDoctors = (unwrap(authResponse) || [])
      .map(normalizeDoctorOption)
      .filter((doctor): doctor is DoctorOption => Boolean(doctor));

    // Secondary source: doctor profile search for specialization enrichment only.
    // We do not surface profile-only records to avoid stale/unlinked profile entries.
    try {
      const profileResponse = await api.get<ApiEnvelope<DoctorRecord[]>>('/doctors/search', {
        params: doctorServiceParams,
      });

      const profileDoctors = (unwrap(profileResponse) || [])
        .map(normalizeDoctorOption)
        .filter((doctor): doctor is DoctorOption => Boolean(doctor));

      const specializationByEmail = new Map<string, string>();
      profileDoctors.forEach((doctor) => {
        const email = (doctor.email || '').trim().toLowerCase();
        if (email && doctor.specialization) {
          specializationByEmail.set(email, doctor.specialization);
        }
      });

      return authDoctors.map((doctor) => {
        const email = (doctor.email || '').trim().toLowerCase();
        return {
          ...doctor,
          specialization: doctor.specialization || (email ? specializationByEmail.get(email) : undefined),
        };
      });
    } catch {
      return authDoctors;
    }
  } catch {
    // Fallback: if auth list is unavailable, keep doctor profile search as backup.
    const fallbackResponse = await api.get<ApiEnvelope<DoctorRecord[]>>('/doctors/search', {
      params: doctorServiceParams,
    });

    const doctors = unwrap(fallbackResponse) || [];
    return doctors
      .map(normalizeDoctorOption)
      .filter((doctor): doctor is DoctorOption => Boolean(doctor));
  }
}
