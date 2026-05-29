import { cn } from '@/lib/utils';
import type { TelemedicineSessionStatus } from '@/lib/telemedicine.types';

type TelemedicineStatusBadgeProps = {
  status?: TelemedicineSessionStatus | string;
  className?: string;
};

const statusClasses: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700 border border-amber-200',
  active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  completed: 'bg-slate-100 text-slate-700 border border-slate-200',
  failed: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const formatLabel = (status?: string) => {
  if (!status) {
    return 'Unknown';
  }

  return status.slice(0, 1).toUpperCase() + status.slice(1).toLowerCase();
};

export function TelemedicineStatusBadge({ status, className }: TelemedicineStatusBadgeProps) {
  const safeStatus = String(status || 'unknown').toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        statusClasses[safeStatus] || 'bg-slate-100 text-slate-700 border border-slate-200',
        className
      )}
    >
      {formatLabel(safeStatus)}
    </span>
  );
}
