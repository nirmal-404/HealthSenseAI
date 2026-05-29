'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, CalendarCheck2, CreditCard, FileText, LayoutDashboard, Pill, Stethoscope, Video } from 'lucide-react';

type PatientSectionPageProps = {
  title: string;
  description: string;
};

const sectionLinks = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: CalendarCheck2 },
  { label: 'Doctors', href: '/patient/doctors', icon: Stethoscope },
  { label: 'Medical Records', href: '/patient/medical-records', icon: FileText },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill },
  { label: 'Payments', href: '/patient/payments', icon: CreditCard },
  { label: 'AI Assistance', href: '/patient/ai-assistance', icon: Bot },
  { label: 'Telemedicine', href: '/patient/telemedicine', icon: Video },
];

export default function PatientSectionPage({ title, description }: PatientSectionPageProps) {
  return (
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <Card className="border border-[#dce5f4] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-[#1f2a44]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            This section is ready for integration with your backend APIs and live data.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-[#dce5f4] bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>Move between patient pages without leaving the shared layout.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {sectionLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-lg border border-[#dce5f2] px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#eef4ff] hover:text-[#2f58db]"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}