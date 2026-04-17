import api from '@/lib/api';
import type {
  ApiEnvelope,
  CreatePrescriptionPayload,
  PrescriptionListFilters,
  PrescriptionRecord,
  UpdatePrescriptionPayload,
} from '@/lib/prescriptions.types';

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data?.data;

type PrescriptionRouteMode = 'doctor-service' | 'patient-service';

type DoctorServiceCreateResponse = {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  createdAt?: string;
};

type DoctorServiceListResponse = {
  items?: Array<{
    prescriptionId: string;
    patientId: string;
    doctorId: string;
    consultationSessionId?: string;
    medications?: Array<{
      name?: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
    }>;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
};

let preferredPrescriptionRoute: PrescriptionRouteMode = 'doctor-service';

const isNotFound = (error: any) => error?.response?.status === 404;

const normalizeDoctorServicePrescription = (
  item: NonNullable<DoctorServiceListResponse['items']>[number]
): PrescriptionRecord => {
  const medications = (item.medications || []).map((medication) => ({
    name: medication.name || '',
    dosage: medication.dosage || '',
    frequency: medication.frequency || '',
    duration: medication.duration || '',
  }));

  return {
    prescriptionId: item.prescriptionId,
    patientId: item.patientId,
    doctorId: item.doctorId,
    appointmentId: item.consultationSessionId || '',
    medications,
    notes: item.notes || '',
    issuedDate: item.createdAt || new Date().toISOString(),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const buildFilterParams = (filters: PrescriptionListFilters = {}) => {
  const params: Record<string, string> = {};

  if (filters.doctorId?.trim()) {
    params.doctorId = filters.doctorId.trim();
  }

  if (filters.patientId?.trim()) {
    params.patientId = filters.patientId.trim();
  }

  if (filters.dateFrom?.trim()) {
    params.dateFrom = filters.dateFrom.trim();
  }

  if (filters.dateTo?.trim()) {
    params.dateTo = filters.dateTo.trim();
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  return params;
};

export async function createPrescription(
  payload: CreatePrescriptionPayload
): Promise<PrescriptionRecord> {
  const createViaDoctorService = async () => {
    const response = await api.post<ApiEnvelope<DoctorServiceCreateResponse>>('/doctors/prescriptions', {
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      consultationSessionId: payload.appointmentId,
      medications: payload.medications,
      notes: payload.notes,
    });

    const data = unwrap(response);

    return {
      prescriptionId: data.prescriptionId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: payload.appointmentId,
      medications: payload.medications,
      notes: payload.notes || '',
      issuedDate: data.createdAt || new Date().toISOString(),
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    };
  };

  const createViaPatientService = async () => {
    const response = await api.post<ApiEnvelope<PrescriptionRecord>>('/patients/prescriptions', payload);
    return unwrap(response);
  };

  if (preferredPrescriptionRoute === 'doctor-service') {
    try {
      return await createViaDoctorService();
    } catch (error: any) {
      if (!isNotFound(error)) {
        throw error;
      }

      const fallbackResult = await createViaPatientService();
      preferredPrescriptionRoute = 'patient-service';
      return fallbackResult;
    }
  }

  try {
    return await createViaPatientService();
  } catch (error: any) {
    if (!isNotFound(error)) {
      throw error;
    }

    const fallbackResult = await createViaDoctorService();
    preferredPrescriptionRoute = 'doctor-service';
    return fallbackResult;
  }
}

export async function getDoctorPrescriptions(
  doctorId: string,
  filters: PrescriptionListFilters = {}
): Promise<PrescriptionRecord[]> {
  const getViaDoctorService = async () => {
    const response = await api.get<ApiEnvelope<DoctorServiceListResponse>>(
      `/doctors/prescriptions/doctor/${doctorId}`,
      {
        params: {
          page: 1,
          limit: 100,
        },
      }
    );

    const data = unwrap(response);
    const items = data?.items || [];
    return items.map(normalizeDoctorServicePrescription);
  };

  const getViaPatientService = async () => {
    const response = await api.get<ApiEnvelope<PrescriptionRecord[]>>(
      `/patients/prescriptions/doctor/${doctorId}`,
      {
        params: buildFilterParams(filters),
      }
    );

    return unwrap(response) || [];
  };

  if (preferredPrescriptionRoute === 'doctor-service') {
    try {
      return await getViaDoctorService();
    } catch (error: any) {
      if (!isNotFound(error)) {
        throw error;
      }

      const fallbackResult = await getViaPatientService();
      preferredPrescriptionRoute = 'patient-service';
      return fallbackResult;
    }
  }

  try {
    return await getViaPatientService();
  } catch (error: any) {
    if (!isNotFound(error)) {
      throw error;
    }

    const fallbackResult = await getViaDoctorService();
    preferredPrescriptionRoute = 'doctor-service';
    return fallbackResult;
  }
}

export async function getPatientPrescriptions(
  patientId: string,
  filters: PrescriptionListFilters = {}
): Promise<PrescriptionRecord[]> {
  const response = await api.get<ApiEnvelope<PrescriptionRecord[]>>(`/patients/${patientId}/prescriptions`, {
    params: buildFilterParams(filters),
  });

  return unwrap(response) || [];
}

export async function getPrescriptionById(prescriptionId: string): Promise<PrescriptionRecord> {
  const response = await api.get<ApiEnvelope<PrescriptionRecord>>(
    `/patients/prescriptions/${prescriptionId}`
  );

  return unwrap(response);
}

export async function updatePrescription(
  prescriptionId: string,
  payload: UpdatePrescriptionPayload
): Promise<PrescriptionRecord> {
  const response = await api.put<ApiEnvelope<PrescriptionRecord>>(
    `/patients/prescriptions/${prescriptionId}`,
    payload
  );

  return unwrap(response);
}

export async function deletePrescription(prescriptionId: string) {
  const response = await api.delete<ApiEnvelope<{ prescriptionId: string }>>(
    `/patients/prescriptions/${prescriptionId}`
  );

  return unwrap(response);
}

export async function downloadPrescription(prescriptionId: string, fileName?: string) {
  const response = await api.get(`/patients/prescriptions/${prescriptionId}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName || `prescription-${prescriptionId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
}
