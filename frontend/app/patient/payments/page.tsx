'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertCircle, Calendar, Clock, CreditCard, DollarSign, FileText, Loader, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getPatientAppointments } from '@/lib/appointments.api';
import { confirmStripePayment, createPaymentIntent, getPatientPaymentHistory } from '@/lib/payments.api';
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

const ProfessionalLoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-12 w-12">
        <Loader className="h-12 w-12 animate-spin text-blue-600" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-slate-600">Processing...</p>
    </div>
  </div>
);

type PaymentFormProps = {
  appointmentId: string;
  paymentId: string;
  amountLabel: string;
  onSuccess: () => void;
};

const PaymentForm = ({ appointmentId, paymentId, amountLabel, onSuccess }: PaymentFormProps) => {
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
        return_url: `${window.location.origin}/patient/payments?appointmentId=${appointmentId}&paymentId=${paymentId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      try {
        await confirmStripePayment(paymentId);
      } catch (confirmError: any) {
        toast.error(getErrorMessage(confirmError, 'Unable to confirm payment yet.'));
      }
    }

    if (paymentIntent?.status === 'succeeded') {
      toast.success('Payment successful.');
    } else if (paymentIntent?.status === 'processing') {
      toast.info('Payment is processing.');
    } else {
      toast.info('Payment status updated.');
    }

    await onSuccess();

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <PaymentElement />
      </div>
      <Button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Pay {amountLabel}
          </>
        )}
      </Button>
    </form>
  );
};

export default function PatientPaymentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const requestedAppointmentId = searchParams.get('appointmentId');
  const requestedPaymentId = searchParams.get('paymentId');
  const confirmAttemptRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!requestedPaymentId) {
      return;
    }

    if (confirmAttemptRef.current === requestedPaymentId) {
      return;
    }

    confirmAttemptRef.current = requestedPaymentId;

    const confirmPayment = async () => {
      try {
        await confirmStripePayment(requestedPaymentId);
        await refreshPayments();
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Unable to confirm payment yet.'));
      }
    };

    void confirmPayment();
  }, [requestedPaymentId, refreshPayments]);

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
  }, [selectedAppointment?.appointmentId, paymentIntent?.appointmentId]);

  const amountLabel = paymentIntent
    ? formatFeeAsCurrency(paymentIntent.amount)
    : selectedAppointment
      ? formatFeeAsCurrency(selectedAppointment.consultationFee)
      : formatFeeAsCurrency(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-slate-200 bg-white shadow-md">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Outstanding Appointments</CardTitle>
                <CardDescription className="mt-0.5">Select a confirmed appointment to pay the consultation fee.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {appointmentsLoading ? (
              <div className="space-y-2">
                <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
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
                    className={`group cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedAppointmentId(appointment.appointmentId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <p className="text-sm font-semibold text-slate-900">
                            {formatAppointmentDate(appointment.appointmentDate)}
                          </p>
                        </div>
                        <div className="ml-6 mt-2 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            {formatStatusLabel(appointment.appointmentType)}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            {formatFeeAsCurrency(appointment.consultationFee)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getAppointmentStatusClasses(
                            appointment.status
                          )}`}
                        >
                          {formatStatusLabel(appointment.status)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                            appointment.paymentStatus
                          )}`}
                        >
                          {formatStatusLabel(appointment.paymentStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                      <Button
                        type="button"
                        size="sm"
                        className={`h-8 rounded-lg px-4 text-xs font-medium transition-all ${
                          payable
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                        disabled={!payable}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedAppointmentId(appointment.appointmentId);
                        }}
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No unpaid appointments right now.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-md">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">Payment Portal</CardTitle>
                <CardDescription className="mt-0.5">Securely complete your consultation payment.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!stripePromise ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Stripe public key is not configured. Add NEXT_PUBLIC_STRIPE_PUBLIC_KEY in the frontend environment.</span>
                </div>
              </div>
            ) : selectedAppointment ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-slate-900 text-sm">Appointment Summary</p>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      Secure
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                      <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Date</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {formatAppointmentDate(selectedAppointment.appointmentDate)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                      <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Time</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {formatAppointmentTimeRange(
                          selectedAppointment.startTime,
                          selectedAppointment.endTime
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-slate-100">
                      <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Type</p>
                      <p className="text-sm text-slate-900 font-medium">
                        {formatStatusLabel(selectedAppointment.appointmentType)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200">
                      <p className="text-[10px] font-semibold uppercase text-emerald-600 mb-1">Amount</p>
                      <p className="text-sm text-emerald-900 font-bold">
                        {formatFeeAsCurrency(selectedAppointment.consultationFee)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedAppointment.status !== 'confirmed' ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">This appointment must be confirmed by the doctor before payment can be completed.</p>
                    </div>
                  </div>
                ) : intentLoading ? (
                  <ProfessionalLoadingSpinner />
                ) : intentError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-rose-700">{intentError}</span>
                    </div>
                  </div>
                ) : paymentIntent?.clientSecret ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: paymentIntent.clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#2563eb',
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                            },
                          },
                        }}
                      >
                        <PaymentForm
                          appointmentId={paymentIntent.appointmentId}
                          paymentId={paymentIntent.paymentId}
                          amountLabel={amountLabel}
                          onSuccess={refreshPayments}
                        />
                      </Elements>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-600">Select a confirmed appointment to start a payment.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-600">Select an appointment to continue.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-md">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900">Payment History</CardTitle>
              <CardDescription className="mt-0.5">Track previously completed payments and transactions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {historyLoading ? (
            <div className="space-y-2">
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : paymentHistory.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.paymentId} className="transition-colors hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-600">
                              {(payment.doctorFirstName?.[0] || 'D').toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">
                            {payment.doctorFirstName} {payment.doctorLastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatFeeAsCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusBadge(
                            payment.status
                          )}`}
                        >
                          {formatStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatPaymentDate(payment.initiatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No payments recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}