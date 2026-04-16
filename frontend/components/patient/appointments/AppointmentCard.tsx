import { CalendarClock, CircleDollarSign, Clock3, Pill, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
    <Card className="border border-[#dce5f4] bg-white py-0 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1f2a44]">
              {formatAppointmentDate(appointment.appointmentDate)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
            </p>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Stethoscope className="h-3.5 w-3.5" /> Doctor
            </p>
            <p className="mt-1 text-sm font-medium text-[#1f2a44]">{doctorLabel || appointment.doctorId}</p>
          </div>

          <div className="rounded-xl border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <CalendarClock className="h-3.5 w-3.5" /> Type
            </p>
            <p className="mt-1 text-sm font-medium text-[#1f2a44]">
              {formatStatusLabel(appointment.appointmentType)}
            </p>
          </div>

          <div className="rounded-xl border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <CircleDollarSign className="h-3.5 w-3.5" /> Payment
            </p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getPaymentStatusClasses(
                appointment.paymentStatus
              )}`}
            >
              {formatStatusLabel(appointment.paymentStatus)}
            </span>
          </div>

          <div className="rounded-xl border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Clock3 className="h-3.5 w-3.5" /> Appointment ID
            </p>
            <p className="mt-1 text-sm font-medium text-[#1f2a44]">{appointment.appointmentId}</p>
          </div>
        </div>

        {appointment.symptoms ? (
          <div className="rounded-xl border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Pill className="h-3.5 w-3.5" /> Symptoms / Reason
            </p>
            <p className="mt-1 text-sm text-slate-600">{appointment.symptoms}</p>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-[#e6edf8] bg-[#fcfdff] p-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-[#dce5f2] bg-white text-slate-700 hover:bg-[#eef4ff] hover:text-[#2f58db]"
          onClick={() => onReschedule(appointment)}
          disabled={!rescheduleAllowed || Boolean(actionLoading)}
        >
          {actionLoading === 'reschedule' ? 'Rescheduling...' : 'Reschedule'}
        </Button>

        <Button
          type="button"
          variant="destructive"
          className="rounded-xl"
          onClick={() => onCancel(appointment)}
          disabled={!cancelAllowed || Boolean(actionLoading)}
        >
          {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </Button>
      </CardFooter>
    </Card>
  );
}
