export interface MedicationLine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionRecord {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medications: MedicationLine[];
  notes?: string;
  issuedDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  medications: MedicationLine[];
  notes?: string;
}

export interface UpdatePrescriptionPayload {
  medications?: MedicationLine[];
  notes?: string;
}

export interface PrescriptionListFilters {
  doctorId?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}
