'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  bookAppointment,
  cancelAppointment,
  getPatientAppointments,
  rescheduleAppointment,
  searchDoctors,
} from '@/lib/appointments.api';
import type {
  Appointment,
  AppointmentStatusFilter,
  BookAppointmentPayload,
  DoctorOption,
  RescheduleAppointmentPayload,
} from '@/lib/appointments.types';
import { AppointmentFilters } from '@/components/patient/appointments/AppointmentFilters';
import { AppointmentCard } from '@/components/patient/appointments/AppointmentCard';
import { BookAppointmentDialog } from '@/components/patient/appointments/BookAppointmentDialog';
import { RescheduleAppointmentDialog } from '@/components/patient/appointments/RescheduleAppointmentDialog';
import { CancelAppointmentDialog } from '@/components/patient/appointments/CancelAppointmentDialog';

const PAGE_SIZE = 6;

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filters, setFilters] = useState<{ status: AppointmentStatusFilter; date: string }>({
    status: 'all',
    date: '',
  });

  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [actionLoadingById, setActionLoadingById] = useState<
    Record<string, 'reschedule' | 'cancel' | null>
  >({});

  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const fetchAppointments = useCallback(
    async (showRefreshSpinner = false) => {
      if (!user?.id) {
        setLoadingList(false);
        return;
      }

      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoadingList(true);
      }

      try {
        const data = await getPatientAppointments(user.id, {
          status: filters.status,
          date: filters.date || undefined,
        });
        setAppointments(data);
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to load appointments.'));
      } finally {
        if (showRefreshSpinner) {
          setRefreshing(false);
        } else {
          setLoadingList(false);
        }
      }
    },
    [filters.date, filters.status, user?.id]
  );

  const handleDoctorSearch = useCallback(async (query: string) => {
    setDoctorLoading(true);
    setDoctorError(null);

    try {
      const doctors = await searchDoctors({ name: query });
      setDoctorOptions(doctors);

      if (!doctors.length && query.trim()) {
        setDoctorError('No doctors found for this search.');
      }
    } catch {
      setDoctorError('Unable to load doctors right now. Please refresh or reopen the dialog.');
    } finally {
      setDoctorLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    void handleDoctorSearch('');
  }, [handleDoctorSearch]);

  const doctorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    doctorOptions.forEach((doctor) => {
      map.set(
        doctor.id,
        doctor.specialization ? `${doctor.name} - ${doctor.specialization}` : doctor.name
      );
    });
    return map;
  }, [doctorOptions]);

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return appointments.slice(start, start + PAGE_SIZE);
  }, [appointments, currentPage]);

  const handleBookAppointment = async (payload: BookAppointmentPayload) => {
    setBookingSubmitting(true);
    try {
      const createdAppointment = await bookAppointment(payload);
      await fetchAppointments(true);
      if (createdAppointment?.appointmentId) {
        router.push(`/patient/payments?appointmentId=${createdAppointment.appointmentId}`);
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to book appointment.'));
      throw error;
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleRescheduleAppointment = async (
    appointmentId: string,
    payload: RescheduleAppointmentPayload
  ) => {
    setRescheduleSubmitting(true);
    setActionLoadingById((prev) => ({ ...prev, [appointmentId]: 'reschedule' }));

    try {
      await rescheduleAppointment(appointmentId, payload);
      toast.success('Appointment rescheduled successfully.');
      setRescheduleTarget(null);
      await fetchAppointments(true);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to reschedule appointment.'));
      throw error;
    } finally {
      setRescheduleSubmitting(false);
      setActionLoadingById((prev) => ({ ...prev, [appointmentId]: null }));
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    setCancelSubmitting(true);
    setActionLoadingById((prev) => ({ ...prev, [appointment.appointmentId]: 'cancel' }));

    try {
      await cancelAppointment(appointment.appointmentId);
      toast.success('Appointment cancelled successfully.');
      setCancelTarget(null);
      await fetchAppointments(true);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to cancel appointment.'));
      throw error;
    } finally {
      setCancelSubmitting(false);
      setActionLoadingById((prev) => ({ ...prev, [appointment.appointmentId]: null }));
    }
  };

  const handleStatusChange = (status: AppointmentStatusFilter) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleDateChange = (date: string) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, date }));
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilters({ status: 'all', date: '' });
  };

  return (
    <div className="space-y-4 p-3 md:p-4 lg:p-5">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button
            type="button"
            className="h-10 rounded-lg bg-blue-600 px-5 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow"
            onClick={() => setBookDialogOpen(true)}
            disabled={!user?.id}
          >
            <Plus className="mr-2 h-5 w-5" />
            Book New Appointment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AppointmentFilters
        status={filters.status}
        date={filters.date}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onClear={handleClearFilters}
        onRefresh={() => void fetchAppointments(true)}
        refreshing={refreshing}
      />

      {/* Appointments List */}
      {loadingList ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`appointment-skeleton-${index}`}
              className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="space-y-3">
                <div className="h-5 w-36 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-16 w-full bg-slate-100 rounded" />
                <div className="h-8 w-full bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-blue-100 p-3">
              <CalendarCheck2 className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <h3 className="mb-1 text-lg font-semibold text-slate-900">No Appointments Found</h3>
          <p className="mx-auto mb-5 max-w-md text-slate-600">
            You don't have any appointments yet. Start by booking your first appointment with a healthcare provider.
          </p>
          <Button
            type="button"
            className="h-9 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700"
            onClick={() => setBookDialogOpen(true)}
            disabled={!user?.id}
          >
            Book Your First Appointment
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginatedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.appointmentId}
                appointment={appointment}
                doctorLabel={doctorLabelMap.get(appointment.doctorId)}
                actionLoading={actionLoadingById[appointment.appointmentId] || null}
                onReschedule={setRescheduleTarget}
                onCancel={setCancelTarget}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(currentPage * PAGE_SIZE, appointments.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{appointments.length}</span> appointments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      type="button"
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 rounded-lg p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Dialogs */}
      <BookAppointmentDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        patientId={user?.id || ''}
        doctorOptions={doctorOptions}
        doctorLoading={doctorLoading}
        doctorError={doctorError}
        submitting={bookingSubmitting}
        onDoctorSearch={handleDoctorSearch}
        onSubmit={handleBookAppointment}
      />

      <RescheduleAppointmentDialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleTarget(null);
          }
        }}
        appointment={rescheduleTarget}
        submitting={rescheduleSubmitting}
        onSubmit={handleRescheduleAppointment}
      />

      <CancelAppointmentDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
          }
        }}
        appointment={cancelTarget}
        submitting={cancelSubmitting}
        onConfirm={handleCancelAppointment}
      />

      {!loadingList && !refreshing && !user?.id ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Session Lost:</span> Unable to detect patient session. Please sign in again to manage your appointments.
          </p>
        </div>
      ) : null}
    </div>
  );
}
