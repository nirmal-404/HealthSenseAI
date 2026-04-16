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
      <DialogContent className="max-h-[90vh] w-[min(96vw,800px)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-0 shadow-lg sm:max-w-[800px]">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
            <DialogTitle className="text-2xl font-bold text-slate-900">Book an Appointment</DialogTitle>
            <DialogDescription className="mt-2 text-slate-600">
              Schedule a consultation with a healthcare provider. Select a doctor, date, time, and consultation type.
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="space-y-6 px-6 py-6">
            {/* Doctor Selection Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Healthcare Provider</h3>
              
              <div className="flex gap-2 mb-3">
                <Input
                  id="doctor-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by doctor name..."
                  className="flex-1 h-10 rounded-lg border-slate-300 bg-white"
                />
                <Button
                  type="button"
                  onClick={() => void handleSearchDoctors()}
                  variant="outline"
                  className="h-10 rounded-lg border-slate-300 hover:bg-blue-50"
                  disabled={doctorLoading}
                >
                  {doctorLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Doctor list */}
              <div className="max-h-48 space-y-2 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                {doctorOptions.length ? (
                  doctorOptions.map((doctor) => {
                    const active = selectedDoctorId === doctor.id;
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={`w-full rounded-lg border-2 px-4 py-3 text-left transition ${
                          active
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{doctor.name}</p>
                        {doctor.specialization ? (
                          <p className="text-xs text-slate-600">{doctor.specialization}</p>
                        ) : null}
                        {doctor.email ? (
                          <p className="text-xs text-slate-500">{doctor.email}</p>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-100 px-3 py-8 text-center text-sm text-slate-600">
                    Search for a doctor to get started
                  </p>
                )}
              </div>

              {selectedDoctorLabel ? (
                <p className="text-sm font-medium text-emerald-600">✓ Selected: {selectedDoctorLabel}</p>
              ) : null}
              {doctorError ? (
                <p className="text-sm text-rose-600">⚠ {doctorError}</p>
              ) : null}
            </div>

            {/* Appointment Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Appointment Details</h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appointment-date" className="text-sm font-semibold text-slate-700">
                    Date
                  </Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentDate}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    className="h-10 rounded-lg border-slate-300 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Consultation Type</Label>
                  <Select
                    value={appointmentType}
                    onValueChange={(value) => setAppointmentType(value as AppointmentType)}
                  >
                    <SelectTrigger className="h-10 rounded-lg border-slate-300 bg-white text-slate-900">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Consultation</SelectItem>
                      <SelectItem value="in-person">In-Person Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-sm font-semibold text-slate-700">
                    Start Time
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-10 rounded-lg border-slate-300 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time" className="text-sm font-semibold text-slate-700">
                    End Time
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="h-10 rounded-lg border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint Section */}
            <div className="space-y-2">
              <Label htmlFor="symptoms" className="text-sm font-semibold text-slate-700">
                Chief Complaint / Reason for Visit
              </Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Describe your symptoms or reason for consultation..."
                className="min-h-24 rounded-lg border-slate-300 bg-white resize-none"
              />
            </div>

            {/* Validation Error */}
            {validationError ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <p className="font-semibold mb-1">Unable to book appointment</p>
                <p>{validationError}</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <DialogFooter className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-300 hover:bg-slate-100"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
