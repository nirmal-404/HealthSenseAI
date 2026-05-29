export type EventHandler = (eventData: any) => Promise<void>;

export interface ConsultationCompletedPayload {
  sessionId: string;
  patientId: string;
  doctorId: string;
  consultationDate: string;
  consultationTime: string;
  duration: number; // in minutes
  status: "completed" | "cancelled";
  patientName: string;
  doctorName: string;
  patientEmail: string;
  patientPhone: string;
  doctorEmail: string;
  doctorPhone: string;
  notes?: string;
}
