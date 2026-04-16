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
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
        getAppointmentStatusClasses(status),
        className
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
