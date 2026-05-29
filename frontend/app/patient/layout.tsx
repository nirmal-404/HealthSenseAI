'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { RoleGuard } from '@/components/common/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  CalendarCheck2,
  Clock3,
  CreditCard,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Pill,
  Search,
  Stethoscope,
  Video,
} from 'lucide-react';

type PatientLayoutProps = {
  children: ReactNode;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: CalendarCheck2 },
  { label: 'Doctors', href: '/patient/doctors', icon: Stethoscope },
  { label: 'Medical Records', href: '/patient/medical-records', icon: FileText },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill },
  { label: 'Payments', href: '/patient/payments', icon: CreditCard },
  { label: 'HealthSense AI', href: '/patient/ai-assistance', icon: Bot },
  { label: 'Telemedicine', href: '/patient/telemedicine', icon: Video },
];

const pageTitles: Record<string, string> = {
  '/patient/dashboard': 'Dashboard',
  '/patient/appointments': 'Appointments',
  '/patient/doctors': 'Doctors',
  '/patient/medical-records': 'Medical Records',
  '/patient/prescriptions': 'Prescriptions',
  '/patient/payments': 'Payments',
  '/patient/ai-assistance': 'AI Assistance',
  '/patient/telemedicine': 'Telemedicine',
};

function initials(firstName?: string, lastName?: string) {
  const first = firstName?.[0] ?? 'P';
  const last = lastName?.[0] ?? 'T';
  return `${first}${last}`.toUpperCase();
}

function formatLastLogin(lastLogin?: string) {
  if (!lastLogin) return 'N/A';

  const parsed = new Date(lastLogin);
  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleString();
}

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  const matchedPath = Object.keys(pageTitles).find((path) => pathname.startsWith(`${path}/`));
  return matchedPath ? pageTitles[matchedPath] : 'Dashboard';
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const pathname = usePathname();
  const { user, logout, refreshUser } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    if (!user?.firstName) {
      void refreshUser();
    }
  }, [user?.firstName, refreshUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const firstName = user?.firstName?.trim() ?? '';
  const lastName = user?.lastName?.trim() ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Patient User';
  const profileStatus = user?.isEmailVerified ? 'Email Verified' : 'Verification Pending';
  const formattedLastLogin = formatLastLogin(user?.lastLogin);
  const pageTitle = getPageTitle(pathname);
  const formattedTime = currentDateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = currentDateTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isActiveItem = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <RoleGuard allowedRoles={['patient']}>
      <main className="h-screen overflow-hidden bg-[#eff4fc] p-2 md:p-4 lg:p-6">
        <div className="mx-auto flex h-full w-full max-w-[1600px] overflow-hidden rounded-[28px] border border-[#dce5f4] bg-[#f8fbff] shadow-[0_24px_70px_rgba(45,90,180,0.14)]">
          <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-[#e6edf8] bg-[#f9fbff] px-4 py-5 lg:flex">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-xl bg-[#3363ea] p-2 text-white shadow-sm shadow-blue-200">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#1f2a44]">HealthSenseAI</p>
                <p className="text-xs text-slate-400">Patient Workspace</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveItem(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#eaf1ff] text-[#345ede]'
                        : 'text-slate-500 hover:bg-[#eef4ff] hover:text-[#345ede]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-[#3460e9] px-2 py-0.5 text-[11px] font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#3b66ea] to-[#2952cf] p-4 text-white">
                <p className="mt-2 text-3xl font-semibold leading-none tracking-wide">{formattedTime}</p>
                <p className="mt-1 text-sm text-blue-100">{formattedDate}</p>
              </div>

              <button
                onClick={() => void logout()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce5f2] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#c7d8fb] hover:bg-[#eef4ff] hover:text-[#2f58db]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </aside>

          <section className="flex h-full flex-1 flex-col overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6edf8] bg-white px-4 py-4 md:px-6 lg:px-8">
              <div>
                <h1 className="text-xl font-semibold text-[#1d2944]">{pageTitle}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="relative w-60 max-w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search here..."
                    className="h-10 w-full rounded-full border border-[#dce5f2] bg-[#f7f9fd] pl-9 pr-3 text-sm text-slate-600 outline-none transition focus:border-[#8aa6ff]"
                  />
                </label>

                <NotificationBell userId={user?.id} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border border-[#dce5f2] bg-white px-2 py-1 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf1ff] text-xs font-bold text-[#2f58db]">
                        {initials(user?.firstName, user?.lastName)}
                      </div>
                      <div className="pr-1">
                        <p className="max-w-[160px] truncate text-sm font-semibold text-[#1f2a44]" title={fullName}>
                          {fullName}
                        </p>
                        <p className="max-w-[160px] truncate text-[11px] text-slate-500" title={user?.email || 'No email'}>
                          {user?.email || 'No email'}
                        </p>
                        <p className={`text-[10px] font-medium ${user?.isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {profileStatus}
                        </p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-72 rounded-xl border border-[#dce5f2] bg-white p-2">
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Details
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="space-y-2 px-2 py-1 text-sm">
                      <div>
                        <p className="text-[11px] text-slate-500">Name</p>
                        <p className="font-medium text-[#1f2a44]">{fullName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Email</p>
                        <p className="truncate font-medium text-[#1f2a44]">{user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Phone</p>
                        <p className="font-medium text-[#1f2a44]">{user?.phoneNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Address</p>
                        <p className="font-medium text-[#1f2a44]">{user?.address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Last Login</p>
                        <p className="font-medium text-[#1f2a44]">{formattedLastLogin}</p>
                      </div>
                    </div>

                    <DropdownMenuSeparator />
                    <button
                      onClick={() => void logout()}
                      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#dce5f2] bg-[#f8fbff] px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#c7d8fb] hover:bg-[#eef4ff] hover:text-[#2f58db]"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <div className="border-b border-[#e6edf8] bg-[#fcfdff] px-4 py-3 lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveItem(item.href);

                  return (
                    <Link
                      key={`mobile-${item.label}`}
                      href={item.href}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                        active
                          ? 'border-[#d6e2ff] bg-[#eaf1ff] text-[#315ae7]'
                          : 'border-[#dce5f2] bg-white text-slate-500'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {children}
            </div>
          </section>
        </div>
      </main>
    </RoleGuard>
  );
}