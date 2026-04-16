import type {
  AppointmentStatus,
  PaymentStatus,
} from '@/lib/appointments.types';

const statusStyles: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  rejected: 'bg-slate-200 text-slate-700',
};

const paymentStyles: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  refunded: 'bg-indigo-100 text-indigo-700',
};

export function getAppointmentStatusClasses(status: AppointmentStatus) {
  return statusStyles[status] ?? statusStyles.pending;
}

export function getPaymentStatusClasses(status: PaymentStatus) {
  return paymentStyles[status] ?? paymentStyles.pending;
}

export function formatAppointmentDate(dateValue: string | Date) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return 'Invalid date';
  }

  return parsed.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAppointmentTimeRange(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return Number.NaN;
  }

  return h * 60 + m;
}

export function isValidTimeRange(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return start < end;
}

export function isPastDate(isoDate: string) {
  if (!isoDate) {
    return false;
  }

  const selected = new Date(isoDate);
  selected.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected < today;
}

export function canReschedule(status: AppointmentStatus) {
  return !['cancelled', 'rejected', 'completed'].includes(status);
}

export function canCancel(status: AppointmentStatus) {
  return status !== 'completed';
}

export function formatStatusLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
