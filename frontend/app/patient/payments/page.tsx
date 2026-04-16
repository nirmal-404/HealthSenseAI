'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getPatientAppointments } from '@/lib/appointments.api';
import { createPaymentIntent, getPatientPaymentHistory } from '@/lib/payments.api';
import type { Appointment } from '@/lib/appointments.types';
import type { PaymentIntentResponse, PaymentRecord, PaymentStatus } from '@/lib/payments.types';
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  formatStatusLabel,
  getAppointmentStatusClasses,
  getPaymentStatusClasses,
} from '@/lib/appointments.utils';
import { formatFeeAsCurrency } from '@/lib/appointmentPricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  : null;

const paymentStatusStyles: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  refunded: 'bg-indigo-100 text-indigo-700',
};

const getPaymentStatusBadge = (status: PaymentStatus) =>
  paymentStatusStyles[status] || 'bg-slate-100 text-slate-700';

const isPayableAppointment = (appointment: Appointment) =>
  appointment.status === 'confirmed' && appointment.paymentStatus !== 'paid';

const formatPaymentDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString();
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

type PaymentFormProps = {
  appointmentId: string;
  amountLabel: string;
  onSuccess: () => void;
};

const PaymentForm = ({ appointmentId, amountLabel, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/patient/payments?appointmentId=${appointmentId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      toast.success('Payment successful.');
      onSuccess();
    } else if (paymentIntent?.status === 'processing') {
      toast.info('Payment is processing.');
      onSuccess();
    } else {
      toast.info('Payment status updated.');
      onSuccess();
    }

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <PaymentElement />
      </div>
      <Button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {submitting ? 'Processing...' : `Pay ${amountLabel}`}
      </Button>
    </form>
  );
};

export default function PatientPaymentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const requestedAppointmentId = searchParams.get('appointmentId');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) {
      setAppointmentsLoading(false);
      return;
    }

    setAppointmentsLoading(true);
    try {
      const data = await getPatientAppointments(user.id, { status: 'all' });
      setAppointments(data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Unable to load appointments.'));
    } finally {
      setAppointmentsLoading(false);
    }
  }, [user?.id]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!user?.id) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      const data = await getPatientPaymentHistory(user.id);
      setPaymentHistory(data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Unable to load payment history.'));
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  const refreshPayments = useCallback(async () => {
    await Promise.all([fetchAppointments(), fetchPaymentHistory()]);
  }, [fetchAppointments, fetchPaymentHistory]);

  useEffect(() => {
    void fetchAppointments();
    void fetchPaymentHistory();
  }, [fetchAppointments, fetchPaymentHistory]);

  useEffect(() => {
    if (requestedAppointmentId) {
      setSelectedAppointmentId(requestedAppointmentId);
    }
  }, [requestedAppointmentId]);

  const unpaidAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.paymentStatus !== 'paid'),
    [appointments]
  );

  useEffect(() => {
    if (!unpaidAppointments.length) {
      return;
    }

    const hasSelection = selectedAppointmentId
      ? unpaidAppointments.some((appointment) => appointment.appointmentId === selectedAppointmentId)
      : false;

    if (!hasSelection) {
      setSelectedAppointmentId(unpaidAppointments[0].appointmentId);
    }
  }, [selectedAppointmentId, unpaidAppointments]);

  const selectedAppointment = useMemo(
    () =>
      appointments.find(
        (appointment) => appointment.appointmentId === selectedAppointmentId
      ) || null,
    [appointments, selectedAppointmentId]
  );

  useEffect(() => {
    if (!selectedAppointment || !isPayableAppointment(selectedAppointment)) {
      setPaymentIntent(null);
      setIntentError(null);
      return;
    }

    if (paymentIntent?.appointmentId === selectedAppointment.appointmentId) {
      return;
    }

    const loadIntent = async () => {
      setIntentLoading(true);
      setIntentError(null);

      try {
        const intent = await createPaymentIntent(selectedAppointment.appointmentId);
        setPaymentIntent(intent);
      } catch (error: any) {
        setIntentError(getErrorMessage(error, 'Unable to start payment.'));
        setPaymentIntent(null);
      } finally {
        setIntentLoading(false);
      }
    };

    void loadIntent();
  }, [paymentIntent?.appointmentId, selectedAppointment]);

  const amountLabel = paymentIntent
    ? formatFeeAsCurrency(paymentIntent.amount)
    : selectedAppointment
      ? formatFeeAsCurrency(selectedAppointment.consultationFee)
      : formatFeeAsCurrency(0);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Outstanding Appointments</CardTitle>
            <CardDescription>Choose a confirmed appointment to pay the consultation fee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : unpaidAppointments.length ? (
              unpaidAppointments.map((appointment) => {
                const payable = isPayableAppointment(appointment);
                const isSelected = appointment.appointmentId === selectedAppointmentId;
                const actionLabel = payable
                  ? 'Pay now'
                  : appointment.status !== 'confirmed'
                    ? 'Awaiting confirmation'
                    : 'Not payable';

                return (
                  <div
                    key={appointment.appointmentId}
                    className={`rounded-lg border p-3 transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedAppointmentId(appointment.appointmentId)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatAppointmentDate(appointment.appointmentDate)}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Type: {formatStatusLabel(appointment.appointmentType)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Fee: {formatFeeAsCurrency(appointment.consultationFee)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getAppointmentStatusClasses(
                            appointment.status
                          )}`}
                        >
                          {formatStatusLabel(appointment.status)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                            appointment.paymentStatus
                          )}`}
                        >
                          {formatStatusLabel(appointment.paymentStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">
                        Appointment ID: {appointment.appointmentId.slice(0, 10)}...
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-lg px-3 text-xs"
                        disabled={!payable}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedAppointmentId(appointment.appointmentId);
                        }}
                        variant={payable ? 'default' : 'outline'}
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No unpaid appointments right now.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Payment Portal</CardTitle>
            <CardDescription>Securely complete your consultation payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stripePromise ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Stripe public key is not configured. Add NEXT_PUBLIC_STRIPE_PUBLIC_KEY in the frontend environment.
              </div>
            ) : selectedAppointment ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Appointment summary</p>
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] uppercase text-slate-400">Date</p>
                      <p className="text-xs text-slate-700">
                        {formatAppointmentDate(selectedAppointment.appointmentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-slate-400">Time</p>
                      <p className="text-xs text-slate-700">
                        {formatAppointmentTimeRange(
                          selectedAppointment.startTime,
                          selectedAppointment.endTime
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-slate-400">Type</p>
                      <p className="text-xs text-slate-700">
                        {formatStatusLabel(selectedAppointment.appointmentType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-slate-400">Fee</p>
                      <p className="text-xs font-semibold text-slate-900">
                        {formatFeeAsCurrency(selectedAppointment.consultationFee)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedAppointment.status !== 'confirmed' ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    This appointment must be confirmed by the doctor before payment can be completed.
                  </div>
                ) : intentLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : intentError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <span>{intentError}</span>
                    </div>
                  </div>
                ) : paymentIntent?.clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentIntent.clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#2563eb',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      appointmentId={paymentIntent.appointmentId}
                      amountLabel={amountLabel}
                      onSuccess={refreshPayments}
                    />
                  </Elements>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Select a confirmed appointment to start a payment.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Select an appointment to continue.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Payment History</CardTitle>
          <CardDescription>Track previously completed payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : paymentHistory.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2">Payment</th>
                    <th className="py-2">Appointment</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td className="py-3 text-slate-700">{payment.paymentId.slice(0, 8)}...</td>
                      <td className="py-3 text-slate-600">{payment.appointmentId.slice(0, 8)}...</td>
                      <td className="py-3 font-semibold text-slate-900">
                        {formatFeeAsCurrency(payment.amount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusBadge(
                            payment.status
                          )}`}
                        >
                          {formatStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{formatPaymentDate(payment.initiatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No payments recorded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}