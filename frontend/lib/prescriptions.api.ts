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

let preferredPrescriptionRoute: PrescriptionRouteMode = 'patient-service';
let preferredPrescriptionReadRoute: PrescriptionRouteMode = 'patient-service';

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

const dedupeAndSortPrescriptions = (items: PrescriptionRecord[]) => {
  const map = new Map<string, PrescriptionRecord>();

  for (const item of items) {
    map.set(item.prescriptionId, item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
  );
};

const getDoctorPrescriptionsViaDoctorService = async (doctorId: string) => {
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

const getDoctorPrescriptionsViaPatientService = async (
  doctorId: string,
  filters: PrescriptionListFilters = {}
) => {
  const response = await api.get<ApiEnvelope<PrescriptionRecord[]>>(
    `/patients/prescriptions/doctor/${doctorId}`,
    {
      params: buildFilterParams(filters),
    }
  );

  return unwrap(response) || [];
};

const getPatientPrescriptionsViaPatientService = async (
  patientId: string,
  filters: PrescriptionListFilters = {}
) => {
  const response = await api.get<ApiEnvelope<PrescriptionRecord[]>>(
    `/patients/${patientId}/prescriptions`,
    {
      params: buildFilterParams(filters),
    }
  );

  return unwrap(response) || [];
};

const getPatientPrescriptionsViaDoctorService = async (patientId: string) => {
  const response = await api.get<ApiEnvelope<DoctorServiceListResponse>>(
    `/doctors/prescriptions/patient/${patientId}`,
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
  const primaryFetcher =
    preferredPrescriptionReadRoute === 'patient-service'
      ? () => getDoctorPrescriptionsViaPatientService(doctorId, filters)
      : () => getDoctorPrescriptionsViaDoctorService(doctorId);

  const secondaryFetcher =
    preferredPrescriptionReadRoute === 'patient-service'
      ? () => getDoctorPrescriptionsViaDoctorService(doctorId)
      : () => getDoctorPrescriptionsViaPatientService(doctorId, filters);

  const [primaryResult, secondaryResult] = await Promise.allSettled([
    primaryFetcher(),
    secondaryFetcher(),
  ]);

  const merged = dedupeAndSortPrescriptions([
    ...(primaryResult.status === 'fulfilled' ? primaryResult.value : []),
    ...(secondaryResult.status === 'fulfilled' ? secondaryResult.value : []),
  ]);

  if (primaryResult.status === 'fulfilled' && primaryResult.value.length > 0) {
    preferredPrescriptionReadRoute =
      preferredPrescriptionReadRoute === 'patient-service'
        ? 'patient-service'
        : 'doctor-service';
  } else if (secondaryResult.status === 'fulfilled' && secondaryResult.value.length > 0) {
    preferredPrescriptionReadRoute =
      preferredPrescriptionReadRoute === 'patient-service'
        ? 'doctor-service'
        : 'patient-service';
  }

  if (merged.length > 0) {
    return merged;
  }

  if (primaryResult.status === 'fulfilled' || secondaryResult.status === 'fulfilled') {
    return [];
  }

  const preferredError =
    primaryResult.status === 'rejected' ? primaryResult.reason : secondaryResult.reason;
  const fallbackError =
    primaryResult.status === 'rejected' && !isNotFound(primaryResult.reason)
      ? primaryResult.reason
      : secondaryResult.status === 'rejected' && !isNotFound(secondaryResult.reason)
        ? secondaryResult.reason
        : preferredError;

  throw fallbackError;
}

export async function getPatientPrescriptions(
  patientId: string,
  filters: PrescriptionListFilters = {}
): Promise<PrescriptionRecord[]> {
  let patientServiceItems: PrescriptionRecord[] = [];

  try {
    patientServiceItems = await getPatientPrescriptionsViaPatientService(patientId, filters);
  } catch (error: any) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  if (patientServiceItems.length > 0) {
    return patientServiceItems;
  }

  try {
    const doctorServiceItems = await getPatientPrescriptionsViaDoctorService(patientId);
    return dedupeAndSortPrescriptions([...patientServiceItems, ...doctorServiceItems]);
  } catch (error: any) {
    if (patientServiceItems.length > 0 || isNotFound(error)) {
      return patientServiceItems;
    }

    throw error;
  }
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
