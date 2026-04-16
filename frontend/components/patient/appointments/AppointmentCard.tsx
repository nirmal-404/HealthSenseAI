import { CalendarDays, Clock, DollarSign, FileText, Stethoscope, ChevronRight } from 'lucide-react';
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
    <Card className="group border border-slate-200 bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">
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
        <div className="space-y-5 mb-6">
          {/* Doctor info - prominent */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Healthcare Provider
              </p>
              <p className="text-base font-semibold text-slate-900">{doctorLabel || appointment.doctorId}</p>
            </div>
          </div>

          {/* Type and payment in 2-column grid */}
          <div className="grid grid-cols-2 gap-4">
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
                  Payment
                </p>
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
            <div className="flex gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <FileText className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
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
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">ID: {appointment.appointmentId.slice(0, 12)}...</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => onReschedule(appointment)}
              disabled={!rescheduleAllowed || Boolean(actionLoading)}
            >
              {actionLoading === 'reschedule' ? 'Rescheduling...' : 'Reschedule'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-lg"
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
