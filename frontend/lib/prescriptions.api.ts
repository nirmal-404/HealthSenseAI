import api from '@/lib/api';
import type {
  ApiEnvelope,
  CreatePrescriptionPayload,
  PrescriptionListFilters,
  PrescriptionRecord,
  UpdatePrescriptionPayload,
} from '@/lib/prescriptions.types';

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data?.data;

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
  const response = await api.post<ApiEnvelope<PrescriptionRecord>>('/patients/prescriptions', payload);
  return unwrap(response);
}

export async function getDoctorPrescriptions(
  doctorId: string,
  filters: PrescriptionListFilters = {}
): Promise<PrescriptionRecord[]> {
  const response = await api.get<ApiEnvelope<PrescriptionRecord[]>>(
    `/patients/prescriptions/doctor/${doctorId}`,
    {
      params: buildFilterParams(filters),
    }
  );

  return unwrap(response) || [];
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
