'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  Video,
} from 'lucide-react';
import { approveAppointment, getDoctorAppointments } from '@/lib/appointments.api';
import type { Appointment } from '@/lib/appointments.types';
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  getPaymentStatusClasses,
  formatStatusLabel,
} from '@/lib/appointments.utils';

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
  key: string;
};

function toDateKey(date: Date) {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function normalizeDateKey(dateValue: string) {
  if (!dateValue) {
    return toDateKey(new Date());
  }

  const [datePart] = dateValue.split('T');
  if (datePart && datePart.length >= 10) {
    return datePart.slice(0, 10);
  }

  return toDateKey(new Date(dateValue));
}

function buildCalendarMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const dayNumber = i - startWeekDay + 1;
    let date: Date;
    let isCurrentMonth = true;

    if (dayNumber < 1) {
      date = new Date(year, month - 1, prevMonthDays + dayNumber);
      isCurrentMonth = false;
    } else if (dayNumber > daysInMonth) {
      date = new Date(year, month + 1, dayNumber - daysInMonth);
      isCurrentMonth = false;
    } else {
      date = new Date(year, month, dayNumber);
    }

    cells.push({
      date,
      isCurrentMonth,
      key: toDateKey(date),
    });
  }

  return cells;
}

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const today = new Date();
  const todayKey = toDateKey(today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingById, setActionLoadingById] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [dateInitialized, setDateInitialized] = useState(false);
  const [activeMonth, setActiveMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getDoctorAppointments(user.id, { status: 'all' });
      setAppointments(data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load appointments.'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'pending'),
    [appointments]
  );

  const approvedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'confirmed'),
    [appointments]
  );

  const calendarAppointments = useMemo(
    () =>
      appointments.filter((appointment) =>
        ['pending', 'confirmed'].includes(appointment.status)
      ),
    [appointments]
  );

  useEffect(() => {
    if (!dateInitialized && calendarAppointments.length) {
      const firstDateKey = normalizeDateKey(calendarAppointments[0].appointmentDate);
      const firstDate = new Date(`${firstDateKey}T00:00:00`);
      setSelectedDate(firstDateKey);
      setActiveMonth({ year: firstDate.getFullYear(), month: firstDate.getMonth() });
      setDateInitialized(true);
    }
  }, [calendarAppointments, dateInitialized]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    calendarAppointments.forEach((appointment) => {
      const dateKey = normalizeDateKey(appointment.appointmentDate);
      const current = map.get(dateKey) ?? [];
      map.set(dateKey, [...current, appointment]);
    });
    return map;
  }, [calendarAppointments]);

  const calendarDays = useMemo(
    () => buildCalendarMonth(activeMonth.year, activeMonth.month),
    [activeMonth]
  );

  const monthLabel = new Date(activeMonth.year, activeMonth.month, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  const selectedAppointments = appointmentsByDate.get(selectedDate) ?? [];

  const handlePrevMonth = () => {
    setActiveMonth((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setActiveMonth((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const handleApprove = async (appointmentId: string) => {
    setActionLoadingById((prev) => ({ ...prev, [appointmentId]: true }));

    try {
      await approveAppointment(appointmentId);
      toast.success('Appointment approved successfully.');
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.appointmentId === appointmentId
            ? { ...appointment, status: 'confirmed' }
            : appointment
        )
      );
      void fetchAppointments();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to approve appointment.'));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1f2a44]">Pending Appointments</h2>
              <p className="text-sm text-slate-500">Review and approve upcoming appointment requests.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingAppointments.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#dce5f4] bg-white p-6 text-sm text-slate-500">
                Loading pending appointments...
              </div>
            ) : pendingAppointments.length ? (
              pendingAppointments.map((appointment) => {
                const patientName = appointment.patientName?.trim();
                const initials = patientName
                  ? patientName
                      .split(' ')
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : appointment.patientId
                    ? appointment.patientId.slice(0, 2).toUpperCase()
                    : 'PT';
                const patientLabel = patientName
                  ? patientName
                  : appointment.patientId
                    ? `Patient ${appointment.patientId.slice(0, 6)}`
                    : 'Patient';
                const reason = appointment.symptoms?.trim() || 'Pending appointment request';
                const TypeIcon = appointment.appointmentType === 'video' ? Video : Stethoscope;
                const isApproving = Boolean(actionLoadingById[appointment.appointmentId]);

                return (
                  <article
                    key={appointment.appointmentId}
                    className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf1ff] text-xs font-bold text-[#2f58db]">
                          {initials}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#1f2a44]">{patientLabel}</p>
                          <p className="text-xs text-slate-500">{reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                        <Button
                          className="h-8 rounded-lg bg-[#2f58db] px-3 text-xs text-white hover:bg-[#2446b8]"
                          onClick={() => void handleApprove(appointment.appointmentId)}
                          disabled={isApproving}
                        >
                          {isApproving ? 'Approving...' : 'Approve'}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#315ae7]" />
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#f0b344]" />
                        {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5 text-[#2f58db]" />
                        {formatStatusLabel(appointment.appointmentType)}
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#dce5f4] bg-white p-6 text-sm text-slate-500">
                No pending appointments right now.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#1f2a44]">Approved Appointments</h2>
              <p className="text-sm text-slate-500">Confirmed appointments with payment status.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {approvedAppointments.length} approved
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#dce5f4] bg-white p-6 text-sm text-slate-500">
                Loading approved appointments...
              </div>
            ) : approvedAppointments.length ? (
              approvedAppointments.map((appointment) => {
                const patientName = appointment.patientName?.trim();
                const initials = patientName
                  ? patientName
                      .split(' ')
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : appointment.patientId
                    ? appointment.patientId.slice(0, 2).toUpperCase()
                    : 'PT';
                const patientLabel = patientName
                  ? patientName
                  : appointment.patientId
                    ? `Patient ${appointment.patientId.slice(0, 6)}`
                    : 'Patient';
                const reason = appointment.symptoms?.trim() || 'Confirmed appointment';
                const TypeIcon = appointment.appointmentType === 'video' ? Video : Stethoscope;

                return (
                  <article
                    key={`approved-${appointment.appointmentId}`}
                    className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf1ff] text-xs font-bold text-[#2f58db]">
                          {initials}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#1f2a44]">{patientLabel}</p>
                          <p className="text-xs text-slate-500">{reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Approved
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

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#315ae7]" />
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#f0b344]" />
                        {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5 text-[#2f58db]" />
                        {formatStatusLabel(appointment.appointmentType)}
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#dce5f4] bg-white p-6 text-sm text-slate-500">
                No approved appointments yet.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="border border-[#e2eaf6] bg-white shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-[#1f2a44]">Appointment Calendar</CardTitle>
                <p className="text-xs text-slate-500">Select a day to view scheduled requests.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1f2a44]">{monthLabel}</p>
                <span className="rounded-full bg-[#eef4ff] px-2 py-1 text-[11px] font-semibold text-[#2f58db]">
                  {appointmentsByDate.size} days booked
                </span>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const appointments = appointmentsByDate.get(day.key) ?? [];
                  const isSelected = day.key === selectedDate;
                  const hasAppointments = appointments.length > 0;
                  const textColor = isSelected
                    ? 'text-[#2f58db]'
                    : day.isCurrentMonth
                      ? 'text-slate-700'
                      : 'text-slate-300';

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDate(day.key)}
                      className={`flex h-14 flex-col items-center justify-center rounded-lg border text-xs transition ${
                        isSelected
                          ? 'border-[#315ae7] bg-[#eaf1ff]'
                          : 'border-transparent bg-transparent'
                      } ${textColor}`}
                    >
                      <span className="font-medium">{day.date.getDate()}</span>
                      {hasAppointments ? (
                        <span className="mt-1 rounded-full bg-[#315ae7] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {appointments.length}
                        </span>
                      ) : (
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-transparent" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-[#1f2a44]">
                  {formatAppointmentDate(selectedDate)}
                </p>
                {selectedAppointments.length ? (
                  selectedAppointments.map((appointment) => (
                    <div
                      key={`calendar-${appointment.appointmentId}`}
                      className="rounded-lg border border-[#e8eef7] bg-[#f8fbff] px-3 py-2"
                    >
                      <p className="text-xs font-semibold text-[#1f2a44]">
                        {appointment.patientName?.trim()
                          ? appointment.patientName
                          : appointment.patientId
                            ? `Patient ${appointment.patientId.slice(0, 6)}`
                            : 'Patient'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No appointments scheduled.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
