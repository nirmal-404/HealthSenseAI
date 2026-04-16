'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
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
      await bookAppointment(payload);
      await fetchAppointments(true);
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
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <Card className="border border-[#dce5f4] bg-white py-0 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
        <CardHeader className="border-b border-[#e6edf8] pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-[#1f2a44]">Manage Appointments</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Book, reschedule, cancel, and review your appointment history.
              </CardDescription>
            </div>

            <Button
              type="button"
              className="h-10 rounded-xl bg-[#3559d5] text-white hover:bg-[#2d4db9]"
              onClick={() => setBookDialogOpen(true)}
              disabled={!user?.id}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Book appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <AppointmentFilters
            status={filters.status}
            date={filters.date}
            onStatusChange={handleStatusChange}
            onDateChange={handleDateChange}
            onClear={handleClearFilters}
            onRefresh={() => void fetchAppointments(true)}
            refreshing={refreshing}
          />

          {loadingList ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {[0, 1, 2].map((index) => (
                <Card
                  key={`appointment-skeleton-${index}`}
                  className="border border-[#dce5f4] bg-white py-0"
                >
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <Card className="border border-dashed border-[#cfdcf4] bg-[#fbfdff] py-0 shadow-none">
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <div className="rounded-xl bg-[#edf2ff] p-2.5 text-[#3559d5]">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-[#1f2a44]">No appointments found</p>
                <p className="max-w-md text-sm text-slate-500">
                  Try adjusting filters or create your first appointment request.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
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

              {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce5f2] bg-[#f8fbff] p-3">
                  <p className="text-xs text-slate-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-[#dce5f2]"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-[#dce5f2]"
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
        </CardContent>
      </Card>

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
        <p className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Loader2 className="h-3.5 w-3.5" /> Unable to detect patient session. Please sign in again.
        </p>
      ) : null}
    </div>
  );
}
