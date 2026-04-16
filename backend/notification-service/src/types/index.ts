export interface SendNotificationRequest {
  userId: string;
  type: "email" | "sms" | "push";
  category: "appointment" | "payment" | "reminder" | "prescription" | "verification";
  recipient: string;
  subject?: string;
  message: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
}

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  type: string;
  category: string;
  status: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface SendBulkNotificationRequest {
  userIds: string[];
  type: "email" | "sms";
  category: string;
  subject?: string;
  message: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
}

export interface NotificationTemplateRequest {
  templateName: string;
  type: "email" | "sms";
  subject?: string;
  bodyTemplate: string;
  variables: string[];
}

export interface NotificationPreferenceRequest {
  userId: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  appointmentNotifications?: boolean;
  paymentNotifications?: boolean;
  reminderNotifications?: boolean;
  prescriptionNotifications?: boolean;
  verificationNotifications?: boolean;
}

export interface UpdateNotificationPreferenceRequest {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  appointmentNotifications?: boolean;
  paymentNotifications?: boolean;
  reminderNotifications?: boolean;
  prescriptionNotifications?: boolean;
  verificationNotifications?: boolean;
}

export interface NotificationStatus {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  queued: number;
}

export interface AppointmentNotificationPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorEmail: string;
  doctorPhone: string;
  status: "booked" | "confirmed" | "completed" | "cancelled" | "rejected";
  notes?: string;
}

export interface PaymentNotificationPayload {
  paymentId: string;
  userId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending";
  userEmail: string;
  userPhone: string;
  userName: string;
  transactionId: string;
}

export interface PrescriptionNotificationPayload {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  patientEmail: string;
  patientPhone: string;
  patientName: string;
  doctorName: string;
  medications: string[];
}

export interface ConsultationCompletedPayload {
  sessionId: string;
  patientId: string;
  doctorId: string;
  consultationDate: string;
  consultationTime: string;
  duration: number;
  status: "completed" | "cancelled";
  patientName: string;
  doctorName: string;
  patientEmail: string;
  patientPhone: string;
  doctorEmail: string;
  doctorPhone: string;
  notes?: string;
}

export type EventHandler = (eventData: any) => Promise<void>;

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface SMSConfig {
  provider: "twilio" | "sns";
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
