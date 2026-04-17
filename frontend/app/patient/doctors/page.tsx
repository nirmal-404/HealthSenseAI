import Link from 'next/link';
import {
  Clock3,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DoctorProfile = {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  location: string;
  languages: string[];
  rating: number;
  consultationFee: number;
  nextAvailable: string;
  about: string;
};

const doctorProfiles: DoctorProfile[] = [
  {
    id: 'dr-kumod-de-silva',
    name: 'Dr. Kumod De Silva',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD (Internal Medicine)',
    experienceYears: 12,
    location: 'HealthSense City Clinic, Colombo',
    languages: ['English', 'Sinhala'],
    rating: 4.9,
    consultationFee: 2500,
    nextAvailable: 'Today, 4:30 PM',
    about: 'Focuses on preventive care, chronic condition follow-up, and adult wellness consultations.',
  },
  {
    id: 'dr-ravindu-perera',
    name: 'Dr. Ravindu Perera',
    specialty: 'Orthopedics',
    qualifications: 'MBBS, MS (Orthopedics)',
    experienceYears: 10,
    location: 'Mobility and Joint Care Center, Kandy',
    languages: ['English', 'Sinhala'],
    rating: 4.8,
    consultationFee: 2500,
    nextAvailable: 'Wed, 11:30 AM',
    about: 'Handles sports injuries, joint pain, fracture follow-up, and rehabilitation coordination.',
  },
];

const formatFee = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function PatientDoctorsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Doctors</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Specialist Directory</h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse specialist profiles, consultation availability, and expected fees before booking.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Verified professional profiles
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Doctors</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{doctorProfiles.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Specialties</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{new Set(doctorProfiles.map((item) => item.specialty)).size}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Rating</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {(
                doctorProfiles.reduce((total, doctor) => total + doctor.rating, 0) /
                doctorProfiles.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Starting Fee</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {formatFee(Math.min(...doctorProfiles.map((doctor) => doctor.consultationFee)))}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {doctorProfiles.map((doctor) => (
          <Card key={doctor.id} className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg text-slate-900">{doctor.name}</CardTitle>
                    <CardDescription className="mt-0.5 text-sm font-medium text-blue-700">
                      {doctor.specialty}
                    </CardDescription>
                    <p className="mt-1 text-xs text-slate-500">{doctor.qualifications}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  {doctor.rating.toFixed(1)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Experience</p>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                    {doctor.experienceYears} years
                  </p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Next Available</p>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <Clock3 className="h-3.5 w-3.5 text-blue-600" />
                    {doctor.nextAvailable}
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Consultation Fee</p>
                  <p className="text-sm font-bold text-emerald-800">{formatFee(doctor.consultationFee)}</p>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Location</p>
                  <p className="inline-flex items-start gap-1.5 text-sm font-medium text-slate-900">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span>{doctor.location}</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map((language) => (
                    <span
                      key={`${doctor.id}-${language}`}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    >
                      <Languages className="h-3 w-3" />
                      {language}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <p className="text-xs leading-relaxed text-slate-600">{doctor.about}</p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                  <Link href="/patient/appointments">Book Appointment</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}