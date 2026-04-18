import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  CalendarCheck2,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  Pill,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';

type MetricCard = {
  title: string;
  value: string;
  note: string;
  trend: string;
  trendTone: string;
  icon: LucideIcon;
  href: string;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type ScheduleItem = {
  patient: string;
  type: 'Video' | 'In-Person';
  time: string;
  reason: string;
  status: 'Ready' | 'Upcoming' | 'Follow-up';
};

type ActivityItem = {
  title: string;
  when: string;
  note: string;
};

type RevenuePoint = {
  label: string;
  amount: number;
};

const metricCards: MetricCard[] = [
  {
    title: 'Today Appointments',
    value: '12',
    note: '8 confirmed, 4 pending',
    trend: '+14% vs yesterday',
    trendTone: 'text-emerald-600',
    icon: CalendarCheck2,
    href: '/doctor/appointments',
  },
  {
    title: 'Pending Prescriptions',
    value: '05',
    note: '2 urgent refill requests',
    trend: 'Needs review',
    trendTone: 'text-amber-600',
    icon: Pill,
    href: '/doctor/prescriptions',
  },
  {
    title: 'Telemedicine Queue',
    value: '03',
    note: 'Starting within 60 minutes',
    trend: 'Live now',
    trendTone: 'text-blue-600',
    icon: Video,
    href: '/doctor/telemedicine',
  },
  {
    title: 'Pending Payouts',
    value: 'LKR 42,500',
    note: 'Expected settlement by Friday',
    trend: '+8% this week',
    trendTone: 'text-indigo-600',
    icon: CreditCard,
    href: '/doctor/payments',
  },
];

const quickActions: QuickAction[] = [
  {
    title: 'Review Appointments',
    description: 'Approve or adjust pending bookings for the day.',
    href: '/doctor/appointments',
    icon: CalendarDays,
  },
  {
    title: 'Issue Prescription',
    description: 'Create and share prescriptions after paid consultations.',
    href: '/doctor/prescriptions',
    icon: FileText,
  },
  {
    title: 'Start Telemedicine',
    description: 'Join active virtual sessions and monitor call status.',
    href: '/doctor/telemedicine',
    icon: Video,
  },
  {
    title: 'Update Availability',
    description: 'Adjust weekly slots and block unavailable times.',
    href: '/doctor/availability',
    icon: Clock,
  },
];

const todaySchedule: ScheduleItem[] = [
  {
    patient: 'Ravindu Perera',
    type: 'Video',
    time: '09:00 AM - 09:30 AM',
    reason: 'Diabetes follow-up consultation',
    status: 'Ready',
  },
  {
    patient: 'Naduni Silva',
    type: 'In-Person',
    time: '10:15 AM - 10:45 AM',
    reason: 'Respiratory check and medication review',
    status: 'Upcoming',
  },
  {
    patient: 'Ravindu Fernando',
    type: 'Video',
    time: '11:30 AM - 12:00 PM',
    reason: 'Post-treatment progress review',
    status: 'Follow-up',
  },
  {
    patient: 'Imesha Jayawardena',
    type: 'In-Person',
    time: '02:00 PM - 02:30 PM',
    reason: 'Cardiology symptom assessment',
    status: 'Upcoming',
  },
];

const recentActivity: ActivityItem[] = [
  {
    title: 'Lab result uploaded for Patient #PT-2091',
    when: '12 min ago',
    note: 'CBC panel is now available under patient reports.',
  },
  {
    title: 'Prescription signed and sent',
    when: '27 min ago',
    note: 'Prescription #RX-4473 delivered to pharmacy channel.',
  },
  {
    title: 'Appointment confirmed',
    when: '41 min ago',
    note: 'New in-person slot accepted for tomorrow at 10:00 AM.',
  },
  {
    title: 'Payment settlement posted',
    when: '1h ago',
    note: 'LKR 18,500 moved from pending to completed.',
  },
];

const careAlerts = [
  '2 patients marked high priority by AI symptom triage.',
  '1 telemedicine session is waiting for doctor to join.',
  '3 prescriptions require refill authorization today.',
];

const weeklyRevenue: RevenuePoint[] = [
  { label: 'Mon', amount: 28000 },
  { label: 'Tue', amount: 34000 },
  { label: 'Wed', amount: 31000 },
  { label: 'Thu', amount: 42000 },
  { label: 'Fri', amount: 39000 },
  { label: 'Sat', amount: 25000 },
  { label: 'Sun', amount: 18000 },
];

function getScheduleStatusClass(status: ScheduleItem['status']) {
  if (status === 'Ready') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }

  if (status === 'Follow-up') {
    return 'bg-violet-50 text-violet-700 border-violet-100';
  }

  return 'bg-blue-50 text-blue-700 border-blue-100';
}

export default function DoctorDashboardPage() {
  const currentDate = new Date();
  const todayLabel = currentDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const currentTime = currentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const maxRevenue = Math.max(...weeklyRevenue.map((point) => point.amount), 1);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-[#dbe6fb] bg-gradient-to-r from-[#2f59df] via-[#3a67ea] to-[#4d78f2] p-5 text-white shadow-[0_20px_48px_rgba(49,94,214,0.30)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-blue-50">
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor Command Center
            </p>
            <h2 className="text-2xl font-semibold leading-tight md:text-3xl">Good day, Doctor. Your care plan is on track.</h2>
            <p className="max-w-2xl text-sm text-blue-100 md:text-base">
              Review appointments, issue prescriptions, and keep consultations flowing from one place.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-blue-100">Current Shift</p>
            <p className="mt-1 text-lg font-semibold">{todayLabel}</p>
            <p className="text-sm text-blue-100">{currentTime}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/doctor/appointments"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#2f59df] transition hover:bg-blue-50"
          >
            View Today Appointments
          </Link>
          <Link
            href="/doctor/telemedicine"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Join Telemedicine Queue
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-[#dce5f4] bg-white p-4 shadow-[0_8px_20px_rgba(45,90,180,0.08)] transition hover:-translate-y-0.5 hover:border-[#c9d8f6]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-[#1f2a44]">{card.value}</p>
                </div>
                <div className="rounded-xl bg-[#eef4ff] p-2 text-[#325de3]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">{card.note}</p>
              <p className={`mt-1 text-xs font-semibold ${card.trendTone}`}>{card.trend}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-2xl border border-[#dce5f4] bg-white p-5 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1f2a44]">Today Schedule</h3>
              <p className="text-sm text-slate-500">Hardcoded snapshot aligned with current clinical flow.</p>
            </div>
            <Link
              href="/doctor/appointments"
              className="text-sm font-semibold text-[#315ae7] transition hover:text-[#2749be]"
            >
              Manage all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {todaySchedule.map((item) => (
              <div
                key={`${item.patient}-${item.time}`}
                className="rounded-xl border border-[#e4ecf8] bg-[#fbfdff] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1f2a44]">{item.patient}</p>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getScheduleStatusClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {item.time}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    {item.type === 'Video' ? <Video className="h-3.5 w-3.5" /> : <Stethoscope className="h-3.5 w-3.5" />}
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="space-y-6">
          <div className="rounded-2xl border border-[#dce5f4] bg-white p-5 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
            <h3 className="text-lg font-semibold text-[#1f2a44]">Quick Actions</h3>
            <p className="mt-1 text-sm text-slate-500">Jump into the most common doctor workflows.</p>

            <div className="mt-4 space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group flex items-start gap-3 rounded-xl border border-[#e4ecf8] bg-[#fbfdff] px-3 py-3 transition hover:border-[#cedcf7] hover:bg-[#f4f8ff]"
                  >
                    <span className="mt-0.5 rounded-lg bg-white p-2 text-[#315ae7] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#1f2a44]">{action.title}</span>
                      <span className="block text-xs text-slate-500">{action.description}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#dce5f4] bg-white p-5 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
            <h3 className="text-lg font-semibold text-[#1f2a44]">Care Alerts</h3>
            <div className="mt-4 space-y-2.5">
              {careAlerts.map((alert) => (
                <div key={alert} className="flex items-start gap-2 rounded-xl bg-[#fff8eb] px-3 py-2.5 text-sm text-[#8a6115]">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{alert}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-[#dce5f4] bg-white p-5 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1f2a44]">Revenue Trend (Weekly)</h3>
              <p className="text-sm text-slate-500">Consultation income overview for the last seven days.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold text-[#315ae7]">
              <Activity className="h-3.5 w-3.5" />
              Stable Growth
            </span>
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-3">
            {weeklyRevenue.map((point) => {
              const barHeight = Math.max(Math.round((point.amount / maxRevenue) * 120), 24);

              return (
                <div key={point.label} className="text-center">
                  <div className="mx-auto flex h-32 w-full max-w-[40px] items-end rounded-xl bg-[#edf3ff] p-1">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-[#3c66ea] to-[#6f94ff]"
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">{point.label}</p>
                  <p className="text-[10px] text-slate-400">{Math.round(point.amount / 1000)}k</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[#dce5f4] bg-white p-5 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1f2a44]">Recent Activity</h3>
              <p className="text-sm text-slate-500">Latest operations across appointments, prescriptions, and payments.</p>
            </div>
            <Link
              href="/doctor/notifications"
              className="text-sm font-semibold text-[#315ae7] transition hover:text-[#2749be]"
            >
              View notifications
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentActivity.map((item) => (
              <div key={`${item.title}-${item.when}`} className="rounded-xl border border-[#e4ecf8] bg-[#fbfdff] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1f2a44]">{item.title}</p>
                  <span className="text-xs font-medium text-slate-400">{item.when}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Link
              href="/doctor/patients"
              className="rounded-xl border border-[#e4ecf8] bg-[#fbfdff] px-3 py-3 text-center transition hover:border-[#cddaf7]"
            >
              <Users className="mx-auto h-4 w-4 text-[#315ae7]" />
              <p className="mt-1 text-xs font-semibold text-slate-600">Patients</p>
            </Link>
            <Link
              href="/doctor/profile"
              className="rounded-xl border border-[#e4ecf8] bg-[#fbfdff] px-3 py-3 text-center transition hover:border-[#cddaf7]"
            >
              <Stethoscope className="mx-auto h-4 w-4 text-[#315ae7]" />
              <p className="mt-1 text-xs font-semibold text-slate-600">Profile</p>
            </Link>
            <Link
              href="/doctor/payments"
              className="rounded-xl border border-[#e4ecf8] bg-[#fbfdff] px-3 py-3 text-center transition hover:border-[#cddaf7]"
            >
              <CreditCard className="mx-auto h-4 w-4 text-[#315ae7]" />
              <p className="mt-1 text-xs font-semibold text-slate-600">Payouts</p>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
