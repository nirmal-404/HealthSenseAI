'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Loader2,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmbeddedCallDialog } from '@/components/telemedicine/EmbeddedCallDialog';
import { TelemedicineStatusBadge } from '@/components/telemedicine/TelemedicineStatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getPatientAppointments } from '@/lib/appointments.api';
import type { Appointment } from '@/lib/appointments.types';
import { formatAppointmentTimeRange, formatStatusLabel, getAppointmentStatusClasses } from '@/lib/appointments.utils';
import { getPatientPaymentHistory } from '@/lib/payments.api';
import type { PaymentRecord } from '@/lib/payments.types';
import { joinTelemedicineSession, listPatientTelemedicineSessions } from '@/lib/telemedicine.api';
import type { TelemedicineSession, TelemedicineSessionAccess, TelemedicineSessionStatus } from '@/lib/telemedicine.types';

const summaryCards = [
  { title: 'Upcoming Visits', value: '06', icon: CalendarDays, tone: 'from-[#eaf1ff] to-[#f3f7ff]' },
  { title: 'Active Doctors', value: '04', icon: Users, tone: 'from-[#e9f8f0] to-[#f3fcf7]' },
  { title: 'New Reports', value: '03', icon: ClipboardList, tone: 'from-[#fff4e7] to-[#fffaf2]' },
  { title: 'Pending Bills', value: '02', icon: CreditCard, tone: 'from-[#f3efff] to-[#f8f6ff]' },
  { title: 'Wellness Score', value: '92%', icon: Activity, tone: 'from-[#e9f5ff] to-[#f3f9ff]' },
];

const doctorSchedule = [
  { name: 'Dr. Kumod De Silva', speciality: 'General Medicine', time: '09:00 AM - 10:00 AM', status: 'Confirmed' },
  { name: 'Dr. Ravindu Perera', speciality: 'Orthopedics', time: '10:00 AM - 12:00 PM', status: 'Confirmed' },
  { name: 'Dr. Kumod De Silva', speciality: 'Cardiology', time: '01:00 PM - 01:40 PM', status: 'Confirmed' },
  { name: 'Dr. Kumod De Silva', speciality: 'Pediatrics', time: '02:00 PM - 03:00 PM', status: 'Available' },
];

const alerts = [
  { title: 'Oxygen Cylinder Refill Needed', note: '10 minutes ago' },
  { title: 'Ambulance Dispatched', note: '30 minutes ago' },
  { title: 'Room Cleaning Needed', note: '1 hour ago' },
  { title: 'Patient Transport Required', note: 'Yesterday' },
];

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const TELEMEDICINE_DASHBOARD_LIMIT = 4;

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const fromDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const parseAppointmentDate = (dateValue: string): Date | null => {
  const [year, month, day] = dateValue.split('-').map(Number);

  if (
    Number.isInteger(year)
    && Number.isInteger(month)
    && Number.isInteger(day)
    && year > 0
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= 31
  ) {
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
};

const formatTelemedicineAppointmentDate = (value?: string) => {
  if (!value) {
    return 'Date pending';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date pending';
  }

  return parsed.toLocaleDateString();
};

const formatTelemedicineAppointmentTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) {
    return 'Time pending';
  }

  return `${startTime} - ${endTime}`;
};

const getSessionHeadline = (session: TelemedicineSession) => {
  return `${formatTelemedicineAppointmentDate(session.appointmentDate)} • ${formatTelemedicineAppointmentTimeRange(
    session.startTime,
    session.endTime
  )}`;
};

const getDoctorLabel = (session: TelemedicineSession) => {
  return session.doctorName || 'Healthcare provider';
};

const isJoinableStatus = (status: TelemedicineSessionStatus) =>
  status !== 'completed' && status !== 'failed';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [telemedicineSessions, setTelemedicineSessions] = useState<TelemedicineSession[]>([]);
  const [telemedicineLoading, setTelemedicineLoading] = useState(true);
  const [telemedicineRefreshing, setTelemedicineRefreshing] = useState(false);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [callAccess, setCallAccess] = useState<TelemedicineSessionAccess | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [hasAutoSelectedDate, setHasAutoSelectedDate] = useState(false);

  const fetchBillingSummary = useCallback(async () => {
    if (!user?.id) {
      setAppointments([]);
      setPaymentHistory([]);
      return;
    }

    try {
      const [appointmentsData, paymentHistoryData] = await Promise.all([
        getPatientAppointments(user.id, { status: 'all' }),
        getPatientPaymentHistory(user.id),
      ]);

      setAppointments(appointmentsData);
      setPaymentHistory(paymentHistoryData);
    } catch {
      // Keep dashboard rendering with safe defaults if services are temporarily unavailable.
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchBillingSummary();
  }, [fetchBillingSummary]);

  const fetchTelemedicineSessions = useCallback(
    async (showRefreshSpinner = false) => {
      if (!user?.id) {
        setTelemedicineSessions([]);
        setTelemedicineLoading(false);
        return;
      }

      if (showRefreshSpinner) {
        setTelemedicineRefreshing(true);
      } else {
        setTelemedicineLoading(true);
      }

      try {
        const data = await listPatientTelemedicineSessions(user.id, {
          page: 1,
          limit: TELEMEDICINE_DASHBOARD_LIMIT,
        });
        setTelemedicineSessions(data.items || []);
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to load telemedicine sessions.'));
      } finally {
        if (showRefreshSpinner) {
          setTelemedicineRefreshing(false);
        } else {
          setTelemedicineLoading(false);
        }
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void fetchTelemedicineSessions();
  }, [fetchTelemedicineSessions]);

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      void fetchBillingSummary();
      void fetchTelemedicineSessions();
    }, 30000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [fetchBillingSummary, fetchTelemedicineSessions]);

  const handleJoinSession = useCallback(
    async (session: TelemedicineSession) => {
      setJoiningSessionId(session.sessionId);
      try {
        const access = await joinTelemedicineSession(session.sessionId);
        setCallAccess(access);
        setCallOpen(true);
        await fetchTelemedicineSessions(true);
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to join session.'));
      } finally {
        setJoiningSessionId(null);
      }
    },
    [fetchTelemedicineSessions]
  );

  const outstandingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.paymentStatus !== 'paid'),
    [appointments],
  );

  const outstandingAmount = useMemo(
    () =>
      outstandingAppointments.reduce(
        (total, appointment) => total + (appointment.consultationFee || 0),
        0,
      ),
    [outstandingAppointments],
  );

  const completedPaymentsCount = useMemo(
    () =>
      paymentHistory.filter(
        (payment) => payment.status === 'success' || payment.status === 'completed',
      ).length,
    [paymentHistory],
  );

  const totalPaidAmount = useMemo(
    () =>
      paymentHistory
        .filter((payment) => payment.status === 'success' || payment.status === 'completed')
        .reduce((total, payment) => total + (payment.amount || 0), 0),
    [paymentHistory],
  );

  const formatDashboardCurrency = (amount: number) =>
    `LKR ${amount.toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const paymentSummaryCards = [
    {
      key: 'pending',
      title: 'Pending Appointments',
      value: `${outstandingAppointments.length}`,
      valueClassName: 'text-slate-900',
      note: 'Awaiting payment',
      accentClassName: 'from-slate-500/20 to-slate-100/10',
    },
    {
      key: 'outstanding',
      title: 'Outstanding Amount',
      value: formatDashboardCurrency(outstandingAmount),
      valueClassName: 'text-amber-700',
      note: 'Unsettled balance',
      accentClassName: 'from-amber-500/20 to-amber-100/10',
    },
    {
      key: 'completed',
      title: 'Completed Payments',
      value: `${completedPaymentsCount}`,
      valueClassName: 'text-emerald-700',
      note: 'Successful transactions',
      accentClassName: 'from-emerald-500/20 to-emerald-100/10',
    },
    {
      key: 'paid',
      title: 'Total Paid',
      value: formatDashboardCurrency(totalPaidAmount),
      valueClassName: 'text-blue-700',
      note: 'All completed payments',
      accentClassName: 'from-blue-500/20 to-blue-100/10',
    },
  ];

  const monthLabel = calendarMonth.toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  const selectedDateLabel = selectedDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const today = new Date();
  const todayKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const selectedDateKey = toDateKey(selectedDate);

  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    appointments.forEach((appointment) => {
      const appointmentDate = parseAppointmentDate(appointment.appointmentDate);
      if (!appointmentDate) {
        return;
      }

      const key = toDateKey(appointmentDate);
      const existing = grouped.get(key) || [];
      existing.push(appointment);
      grouped.set(key, existing);
    });

    grouped.forEach((group, key) => {
      grouped.set(
        key,
        [...group].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      );
    });

    return grouped;
  }, [appointments]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const gridStart = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1 - firstDay.getDay(),
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const key = toDateKey(date);
      return {
        key,
        date,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === calendarMonth.getMonth(),
        isSelected: key === selectedDateKey,
        isToday: key === todayKey,
        appointmentCount: (appointmentsByDate.get(key) || []).length,
      };
    });
  }, [appointmentsByDate, calendarMonth, selectedDateKey, todayKey]);

  const selectedDayAppointments = useMemo(
    () => appointmentsByDate.get(selectedDateKey) || [],
    [appointmentsByDate, selectedDateKey],
  );

  useEffect(() => {
    if (hasAutoSelectedDate || appointmentsByDate.size === 0) {
      return;
    }

    const appointmentDates = Array.from(appointmentsByDate.keys())
      .map((key) => fromDateKey(key))
      .sort((a, b) => a.getTime() - b.getTime());

    if (!appointmentDates.length) {
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextUpcoming = appointmentDates.find((date) => date.getTime() >= todayStart.getTime());
    const targetDate = nextUpcoming || appointmentDates[0];

    setSelectedDate(targetDate);
    setCalendarMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setHasAutoSelectedDate(true);
  }, [appointmentsByDate, hasAutoSelectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setHasAutoSelectedDate(true);
  };

  const showPreviousMonth = () => {
    setHasAutoSelectedDate(true);
    setCalendarMonth((current) => {
      const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      setSelectedDate(new Date(previous.getFullYear(), previous.getMonth(), 1));
      return previous;
    });
  };

  const showNextMonth = () => {
    setHasAutoSelectedDate(true);
    setCalendarMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
  };

  return (
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-[#1f2a44]">{card.value}</p>
                  <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-500">{card.title}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-b p-2.5 ${card.tone}`}>
                  <Icon className="h-4 w-4 text-[#3762e5]" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[2.2fr_1fr]">
        <div className="space-y-5">
          <article className="h-fit self-start rounded-2xl border border-[#e2eaf6] bg-white p-5 shadow-[0_10px_24px_rgba(45,90,180,0.07)] md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Billing</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#1f2a44] md:text-3xl">Payment Center</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Manage pending consultation fees and review completed transactions in one place.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Secure payment workflow
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {paymentSummaryCards.map((card) => (
                <div
                  key={card.key}
                  className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.05)]"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accentClassName}`} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
                  <p
                    className={`mt-2 text-[clamp(1.85rem,1.6vw,2.35rem)] font-semibold leading-tight tracking-tight break-words ${card.valueClassName}`}
                  >
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{card.note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)] md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-2xl font-semibold text-[#1f2a44]">My Telemedicine Sessions</h2>
                <p className="text-sm text-slate-500">Track upcoming and previous telemedicine consultations.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchTelemedicineSessions(true)}
                disabled={telemedicineRefreshing || telemedicineLoading}
              >
                {telemedicineRefreshing ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                )}
                Refresh
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {telemedicineLoading ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Loading telemedicine sessions...
                </div>
              ) : telemedicineSessions.length ? (
                telemedicineSessions.map((session) => {
                  const joining = joiningSessionId === session.sessionId;

                  return (
                    <article
                      key={session.sessionId}
                      className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{getSessionHeadline(session)}</p>
                          <p className="text-xs text-slate-500">Doctor: {getDoctorLabel(session)}</p>
                        </div>
                        <TelemedicineStatusBadge status={session.status} />
                      </div>

                      <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                        <p className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Created: {formatDateTime(session.createdAt)}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          Type: {(session.appointmentType || 'video').replace('-', ' ')} consultation
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleJoinSession(session)}
                          disabled={!isJoinableStatus(session.status) || joining}
                        >
                          {joining ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PhoneCall className="mr-1 h-3.5 w-3.5" />
                          )}
                          Join
                        </Button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No telemedicine sessions found for this patient.
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f2a44]">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous month"
                onClick={showPreviousMonth}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#dce5f2] hover:bg-slate-50"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180 text-slate-500" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={showNextMonth}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#dce5f2] hover:bg-slate-50"
              >
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-slate-400">
            {weekDays.map((day) => (
              <p key={day}>{day}</p>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5 text-center text-xs">
            {calendarDays.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => handleDateSelect(day.date)}
                className={`relative rounded-lg py-2 transition ${
                  day.isSelected
                    ? 'bg-[#315ae7] font-semibold text-white shadow-sm'
                    : day.inCurrentMonth
                      ? 'text-slate-700 hover:bg-[#f5f8ff]'
                      : 'text-slate-300 hover:bg-[#f8f9fb]'
                } ${day.isToday && !day.isSelected ? 'ring-1 ring-[#9eb7f5]' : ''}`}
              >
                {day.dayNumber}
                {day.appointmentCount > 0 && (
                  <span
                    className={`absolute bottom-1 right-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                      day.isSelected
                        ? 'bg-white/90 text-[#315ae7]'
                        : 'bg-[#315ae7] text-white'
                    }`}
                  >
                    {day.appointmentCount > 9 ? '9+' : day.appointmentCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-[#f8fbff] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#1f2a44]">{selectedDateLabel}</p>
              <span className="inline-flex items-center rounded-full border border-[#d3def4] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#315ae7]">
                {selectedDayAppointments.length} appointment{selectedDayAppointments.length === 1 ? '' : 's'}
              </span>
            </div>

            {selectedDayAppointments.length ? (
              <div className="space-y-2">
                {selectedDayAppointments.map((appointment) => (
                  <div
                    key={appointment.appointmentId}
                    className="rounded-lg border border-[#d7e3ff] bg-gradient-to-r from-[#eef4ff] to-[#f7faff] px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1f2a44]">
                        {formatStatusLabel(appointment.appointmentType)} consultation
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getAppointmentStatusClasses(appointment.status)}`}
                      >
                        {formatStatusLabel(appointment.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#244091]">
                      {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d3def4] bg-white px-3 py-4 text-center text-xs text-slate-500">
                No appointments scheduled for this day.
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f2a44]">Doctor Schedule</h2>
            <button className="rounded-lg border border-[#dce5f2] px-2.5 py-1 text-xs font-medium text-slate-600">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {doctorSchedule.map((doctor) => (
              <div
                key={doctor.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8eef7] bg-[#fcfdff] px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf1ff] text-xs font-bold text-[#2f58db]">
                    {doctor.name
                      .split(' ')
                      .filter((part) => part.length > 0)
                      .slice(1, 3)
                      .map((part) => part[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1f2a44]">{doctor.name}</p>
                    <p className="text-xs text-slate-500">{doctor.speciality}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">{doctor.time}</p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      doctor.status === 'Booked'
                        ? 'bg-rose-100 text-rose-600'
                        : doctor.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {doctor.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f2a44]">Alerts & Tasks</h2>
            <button className="rounded-lg border border-[#dce5f2] px-2.5 py-1 text-xs font-medium text-slate-600">
              New
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <button
                key={alert.title}
                className="flex w-full items-center justify-between rounded-xl border border-[#e8eef7] bg-[#fcfdff] px-3 py-2.5 text-left transition hover:border-[#cfdcf4]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#eaf1ff] p-2 text-[#3560e3]">
                    <ClipboardList className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1f2a44]">{alert.title}</p>
                    <p className="text-xs text-slate-500">{alert.note}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </article>
      </div>

      <EmbeddedCallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        access={callAccess}
        status={callAccess?.status}
      />
    </div>
  );
}
