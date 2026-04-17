export type PaymentStatus = 'pending' | 'success' | 'completed' | 'failed' | 'refunded';

export interface PaymentIntentResponse {
  paymentId: string;
  appointmentId: string;
  userId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId: string;
  clientSecret: string | null;
  notes?: string;
}

export interface PaymentRecord {
  paymentId: string;
  appointmentId: string;
  userId?: string;
  patientId: string;
  doctorId: string;
  doctorFirstName?: string;
  doctorLastName?: string;
  amount: number;
  currency: string;
  paymentMethod: 'mock' | 'stripe' | 'payhere';
  stripePaymentIntentId?: string;
  transactionId?: string;
  status: PaymentStatus;
  failureReason?: string;
  refundReason?: string;
  initiatedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  appointmentId: string;
  status: PaymentStatus;
  normalizedStatus: 'pending' | 'success' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  updatedAt: string;
}
