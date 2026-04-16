import api from '@/lib/api';
import type { ApiEnvelope } from '@/lib/appointments.types';
import type {
  PaymentIntentResponse,
  PaymentRecord,
  PaymentStatusResponse,
} from '@/lib/payments.types';

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data?.data;

export async function createPaymentIntent(
  appointmentId: string,
  notes?: string
): Promise<PaymentIntentResponse> {
  const response = await api.post<ApiEnvelope<PaymentIntentResponse>>('/payments/create', {
    appointmentId,
    notes,
  });

  return unwrap(response);
}

export async function getPatientPaymentHistory(
  patientId: string
): Promise<PaymentRecord[]> {
  const response = await api.get<ApiEnvelope<PaymentRecord[]>>(
    `/payments/patient/${patientId}/history`
  );

  return unwrap(response) || [];
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  const response = await api.get<ApiEnvelope<PaymentStatusResponse>>(
    `/payments/${paymentId}/status`
  );

  return unwrap(response);
}

export async function confirmStripePayment(
  paymentId: string
): Promise<PaymentStatusResponse> {
  const response = await api.post<ApiEnvelope<PaymentStatusResponse>>(
    `/payments/${paymentId}/confirm`
  );

  return unwrap(response);
}
