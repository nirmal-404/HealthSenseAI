import {
  Activity,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Users,
} from 'lucide-react';

const summaryCards = [
  { title: 'Upcoming Visits', value: '06', icon: CalendarDays, tone: 'from-[#eaf1ff] to-[#f3f7ff]' },
  { title: 'Active Doctors', value: '04', icon: Users, tone: 'from-[#e9f8f0] to-[#f3fcf7]' },
  { title: 'New Reports', value: '03', icon: ClipboardList, tone: 'from-[#fff4e7] to-[#fffaf2]' },
  { title: 'Pending Bills', value: '02', icon: CreditCard, tone: 'from-[#f3efff] to-[#f8f6ff]' },
  { title: 'Wellness Score', value: '92%', icon: Activity, tone: 'from-[#e9f5ff] to-[#f3f9ff]' },
];

const trendData = [
  { day: '13 Apr', baseline: 16, visits: 24, meds: 18 },
  { day: '14 Apr', baseline: 20, visits: 12, meds: 16 },
  { day: '15 Apr', baseline: 28, visits: 34, meds: 17 },
  { day: '16 Apr', baseline: 10, visits: 18, meds: 36 },
  { day: '17 Apr', baseline: 26, visits: 40, meds: 29 },
  { day: '18 Apr', baseline: 34, visits: 28, meds: 22 },
  { day: '19 Apr', baseline: 24, visits: 32, meds: 14 },
];

const departmentRings = [
  { name: 'General Medicine', color: '#3f69ec' },
  { name: 'Orthopedics', color: '#58c090' },
  { name: 'Cardiology', color: '#f2b443' },
  { name: 'Gynecology', color: '#f17373' },
];

const doctorSchedule = [
  { name: 'Dr. James Thompson', speciality: 'General Medicine', time: '09:00 AM - 10:00 AM', status: 'Confirmed' },
  { name: 'Dr. Michael Anderson', speciality: 'Orthopedics', time: '10:00 AM - 12:00 PM', status: 'Booked' },
  { name: 'Dr. Olivia Martinez', speciality: 'Cardiology', time: '01:00 PM - 01:40 PM', status: 'Confirmed' },
  { name: 'Dr. Emily Carter', speciality: 'Pediatrics', time: '02:00 PM - 03:00 PM', status: 'Available' },
];

const alerts = [
  { title: 'Oxygen Cylinder Refill Needed', note: '10 minutes ago' },
  { title: 'Ambulance Dispatched', note: '30 minutes ago' },
  { title: 'Room Cleaning Needed', note: '1 hour ago' },
  { title: 'Patient Transport Required', note: 'Yesterday' },
];

const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const monthGrid = [
  ['', '', '1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '10', '11', '12'],
  ['13', '14', '15', '16', '17', '18', '19'],
  ['20', '21', '22', '23', '24', '25', '26'],
  ['27', '28', '29', '30', '1', '2', '3'],
];

const dayEvents = [
  { title: 'Morning Staff Meeting', doctor: '08:00 AM - 09:00 AM', color: 'bg-[#3f69ec]' },
  { title: 'Surgery - Orthopedics', doctor: '10:00 AM - 12:00 PM', color: 'bg-[#315ae7]' },
  { title: 'Training Session (Dr. Carter)', doctor: '01:00 PM - 02:00 PM', color: 'bg-[#3d64df]' },
];

export default function PatientDashboardPage() {
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1.2fr_1fr]">
        <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1f2a44]">Total Trends</h2>
              <p className="text-xs text-slate-500">Daily care activity this week</p>
            </div>
            <button className="rounded-lg border border-[#dce5f2] px-2.5 py-1 text-xs font-medium text-slate-600">
              Last week
            </button>
          </div>

          <div className="rounded-xl bg-[#f8fbff] p-4">
            <div className="grid h-44 grid-cols-7 items-end gap-3">
              {trendData.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2">
                  <div className="flex h-36 items-end gap-1.5">
                    <span
                      className="w-2 rounded-full bg-[#3f69ec]"
                      style={{ height: `${(item.baseline / 42) * 100}%` }}
                    />
                    <span
                      className="w-2 rounded-full bg-[#62c796]"
                      style={{ height: `${(item.visits / 42) * 100}%` }}
                    />
                    <span
                      className="w-2 rounded-full bg-[#f0b344]"
                      style={{ height: `${(item.meds / 42) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{item.day}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3f69ec]" /> Baseline
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#62c796]" /> Visits
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f0b344]" /> Medication
              </span>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1f2a44]">Visits by Department</h2>
              <p className="text-xs text-slate-500">Care distribution today</p>
            </div>
            <button className="rounded-lg border border-[#dce5f2] px-2.5 py-1 text-xs font-medium text-slate-600">
              Today
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="relative h-52 w-52">
              {departmentRings.map((ring, index) => (
                <div
                  key={ring.name}
                  className="absolute rounded-full border-[5px] border-r-transparent border-b-transparent"
                  style={{
                    inset: `${16 * index}px`,
                    borderColor: `${ring.color} transparent transparent ${ring.color}`,
                    transform: `rotate(${18 + index * 16}deg)`,
                  }}
                />
              ))}

              <div className="absolute inset-[66px] flex flex-col items-center justify-center rounded-full border border-[#dce5f2] bg-white text-center">
                <p className="text-3xl font-semibold text-[#1f2a44]">320</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>

          <div className="mt-2 grid gap-2 text-xs text-slate-600">
            {departmentRings.map((ring) => (
              <p key={`legend-${ring.name}`} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ring.color }} />
                {ring.name}
              </p>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e2eaf6] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f2a44]">April 2025</h2>
            <button
              aria-label="Previous month"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#dce5f2]"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-slate-400">
            {weekDays.map((day) => (
              <p key={day}>{day}</p>
            ))}
          </div>

          <div className="mt-2 space-y-1.5">
            {monthGrid.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {week.map((date, dateIndex) => {
                  const active = date === '22';
                  const muted = weekIndex === 4 && Number(date) <= 3;

                  return (
                    <div
                      key={`${weekIndex}-${dateIndex}`}
                      className={`rounded-lg py-1.5 ${
                        active
                          ? 'bg-[#315ae7] font-semibold text-white'
                          : muted
                            ? 'text-slate-300'
                            : 'text-slate-600'
                      }`}
                    >
                      {date}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-[#f8fbff] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#1f2a44]">Tuesday, 22 April</p>
              <button className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#315ae7] text-white">
                +
              </button>
            </div>

            <div className="space-y-2">
              {dayEvents.map((event) => (
                <div key={event.title} className={`rounded-lg px-3 py-2 text-white ${event.color}`}>
                  <p className="text-xs font-medium">{event.title}</p>
                  <p className="text-[11px] text-blue-100">{event.doctor}</p>
                </div>
              ))}
            </div>
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
    </div>
  );
}
