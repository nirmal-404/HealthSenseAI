'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AppointmentType,
  BookAppointmentPayload,
  DoctorOption,
} from '@/lib/appointments.types';
import { isPastDate, isValidTimeRange } from '@/lib/appointments.utils';

type BookAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  submitting?: boolean;
  doctorOptions: DoctorOption[];
  doctorLoading?: boolean;
  doctorError?: string | null;
  onDoctorSearch: (query: string) => Promise<void> | void;
  onSubmit: (payload: BookAppointmentPayload) => Promise<void>;
};

const defaultStartTime = '09:00';
const defaultEndTime = '09:30';

const getNextDay = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split('T')[0];
};

export function BookAppointmentDialog({
  open,
  onOpenChange,
  patientId,
  submitting,
  doctorOptions,
  doctorLoading,
  doctorError,
  onDoctorSearch,
  onSubmit,
}: BookAppointmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getNextDay());
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('video');
  const [symptoms, setSymptoms] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setValidationError(null);
      return;
    }

    if (!doctorOptions.length) {
      void onDoctorSearch('');
    }
  }, [open, doctorOptions.length, onDoctorSearch]);

  const selectedDoctorLabel = useMemo(
    () => doctorOptions.find((doctor) => doctor.id === selectedDoctorId)?.name,
    [doctorOptions, selectedDoctorId]
  );

  const resetForm = () => {
    setSearchQuery('');
    setSelectedDoctorId('');
    setAppointmentDate(getNextDay());
    setStartTime(defaultStartTime);
    setEndTime(defaultEndTime);
    setAppointmentType('video');
    setSymptoms('');
    setValidationError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSearchDoctors = async () => {
    try {
      await onDoctorSearch(searchQuery);
    } catch {
      // Parent handles toast and fallback messaging.
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const doctorId = selectedDoctorId;

    if (!doctorId) {
      setValidationError('Please select a doctor from the list.');
      return;
    }

    if (isPastDate(appointmentDate)) {
      setValidationError('Appointment date must be today or a future date.');
      return;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      setValidationError('End time must be later than start time.');
      return;
    }

    setValidationError(null);

    try {
      await onSubmit({
        patientId,
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        appointmentType,
        symptoms: symptoms.trim(),
      });

      toast.success('Appointment request submitted successfully.');
      handleClose(false);
    } catch {
      // Parent handles error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,920px)] overflow-y-auto rounded-3xl border border-[#dce5f2] bg-white p-0 shadow-[0_18px_42px_rgba(26,53,120,0.18)] sm:max-w-[920px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-[#e6edf8] bg-gradient-to-r from-[#f3f7ff] to-white px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-[#1f2a44]">Book Appointment</DialogTitle>
            <DialogDescription className="max-w-2xl text-sm text-slate-500">
              Create a new appointment request with date, time, and consultation type.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-5 xl:grid-cols-[1.12fr_1fr]">
            <div className="space-y-3 rounded-2xl border border-[#dce7fb] bg-[#f8fbff] p-4">
              <Label htmlFor="doctor-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Find doctor (live)
              </Label>

              <div className="flex gap-2">
                <Input
                  id="doctor-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by doctor name"
                  className="h-10 rounded-xl border-[#cfdcf5] bg-white"
                />
                <Button
                  type="button"
                  onClick={() => void handleSearchDoctors()}
                  variant="outline"
                  className="h-10 rounded-xl border-[#cfdcf5] bg-white"
                  disabled={doctorLoading}
                >
                  {doctorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {doctorOptions.length ? `${doctorOptions.length} doctors available` : 'No doctors loaded yet'}
                </span>
                <span className="text-[#3559d5]">Source: user records</span>
              </div>

              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="h-10 w-full rounded-xl border-[#cfdcf5] bg-white text-slate-700">
                  <SelectValue placeholder="Select doctor from results" />
                </SelectTrigger>
                <SelectContent>
                  {doctorOptions.length ? (
                    doctorOptions.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                        {doctor.specialization ? ` • ${doctor.specialization}` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_results" disabled>
                      No doctors found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <div className="max-h-52 space-y-2 overflow-auto rounded-xl border border-[#dce7fb] bg-white p-2">
                {doctorOptions.length ? (
                  doctorOptions.map((doctor) => {
                    const active = selectedDoctorId === doctor.id;
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setSelectedDoctorId(doctor.id);
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          active
                            ? 'border-[#3559d5] bg-[#eef3ff] text-[#1f2a44]'
                            : 'border-[#e6edf8] bg-white text-slate-700 hover:border-[#c8d8f8] hover:bg-[#f7faff]'
                        }`}
                      >
                        <p className="text-sm font-medium">{doctor.name}</p>
                        {doctor.email ? <p className="text-xs text-slate-500">{doctor.email}</p> : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-[#dce7fb] bg-[#fbfdff] px-3 py-5 text-center text-xs text-slate-500">
                    Search doctors to populate this list.
                  </p>
                )}
              </div>

              {selectedDoctorLabel ? (
                <p className="text-xs text-emerald-600">Selected: {selectedDoctorLabel}</p>
              ) : null}
              {doctorError ? <p className="text-xs text-amber-600">{doctorError}</p> : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-[#dce7fb] bg-white p-4">
              <div className="space-y-1.5">
                <Label htmlFor="appointment-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                  className="h-10 rounded-xl border-[#cfdcf5] bg-[#f9fbff]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consultation type</Label>
                <Select value={appointmentType} onValueChange={(value) => setAppointmentType(value as AppointmentType)}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-[#cfdcf5] bg-[#f9fbff] text-slate-700">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video consultation</SelectItem>
                    <SelectItem value="in-person">In-person visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="start-time" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start time
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-10 rounded-xl border-[#cfdcf5] bg-[#f9fbff]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end-time" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End time
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="h-10 rounded-xl border-[#cfdcf5] bg-[#f9fbff]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 px-6 pb-5">
            <Label htmlFor="symptoms" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Symptoms / reason
            </Label>
            <Textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder="Describe symptoms or consultation reason"
              className="min-h-[92px] rounded-xl border-[#cfdcf5] bg-[#f9fbff]"
            />

            {validationError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {validationError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="sticky bottom-0 rounded-b-3xl border-t border-[#e6edf8] bg-[#f8fbff] px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-[#dce5f2]"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-[#3559d5] text-white hover:bg-[#2d4db9]" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book appointment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
