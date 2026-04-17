import { CalendarDays, Clock, DollarSign, FileText, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Appointment } from '@/lib/appointments.types';
import {
  canCancel,
  canReschedule,
  formatAppointmentDate,
  formatAppointmentTimeRange,
  formatStatusLabel,
  getPaymentStatusClasses,
} from '@/lib/appointments.utils';
import { formatFeeAsCurrency } from '@/lib/appointmentPricing';
import { AppointmentStatusBadge } from '@/components/patient/appointments/AppointmentStatusBadge';

type AppointmentCardProps = {
  appointment: Appointment;
  doctorLabel?: string;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  actionLoading?: 'reschedule' | 'cancel' | null;
};

export function AppointmentCard({
  appointment,
  doctorLabel,
  onReschedule,
  onCancel,
  actionLoading,
}: AppointmentCardProps) {
  const rescheduleAllowed = canReschedule(appointment.status);
  const cancelAllowed = canCancel(appointment.status);

  return (
    <Card className="group border border-slate-200 bg-white py-0 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-4">
        {/* Header with status */}
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-slate-900">
                {formatAppointmentDate(appointment.appointmentDate)}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}</span>
            </div>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        {/* Main content - Doctor and type in one row */}
        <div className="mb-4 space-y-3.5">
          {/* Doctor info - prominent */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Healthcare Provider
              </p>
              <p className="text-sm font-semibold text-slate-900">{doctorLabel || appointment.doctorId}</p>
            </div>
          </div>

          {/* Type and payment in 2-column grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center pt-0.5">
                <span className="text-xs font-bold text-purple-600">Rx</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Appointment Type
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {formatStatusLabel(appointment.appointmentType)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Consultation Fee
                </p>
                {appointment.consultationFee ? (
                  <p className="mb-1.5 text-sm font-semibold text-green-600">{formatFeeAsCurrency(appointment.consultationFee)}</p>
                ) : (
                  <p className="mb-1.5 text-sm font-semibold text-slate-400">Not set</p>
                )}
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                    appointment.paymentStatus
                  )}`}
                >
                  {formatStatusLabel(appointment.paymentStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Symptoms if present */}
          {appointment.symptoms ? (
            <div className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Chief Complaint
                </p>
                <p className="text-sm text-slate-700">{appointment.symptoms}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-md border-slate-300 px-3 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => onReschedule(appointment)}
              disabled={!rescheduleAllowed || Boolean(actionLoading)}
            >
              {actionLoading === 'reschedule' ? 'Rescheduling...' : 'Reschedule'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 rounded-md px-3 text-xs"
              onClick={() => onCancel(appointment)}
              disabled={!cancelAllowed || Boolean(actionLoading)}
            >
              {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
