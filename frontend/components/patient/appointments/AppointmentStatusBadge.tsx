import { cn } from '@/lib/utils';
import { formatStatusLabel, getAppointmentStatusClasses } from '@/lib/appointments.utils';
import type { AppointmentStatus } from '@/lib/appointments.types';

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
  className?: string;
};

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase',
        getAppointmentStatusClasses(status),
        className
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
