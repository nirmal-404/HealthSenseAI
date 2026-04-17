'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, DollarSign } from 'lucide-react';
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
import { getConsultationFee, formatFeeAsCurrency } from '@/lib/appointmentPricing';

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

const dateTimeInputClass =
  'h-10 rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 [color-scheme:light] [&::-webkit-date-and-time-value]:text-slate-900 [&::-webkit-datetime-edit]:text-slate-900 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80';

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

    // Reload when dialog opens so the picker reflects latest backend doctors.
    void onDoctorSearch('');
  }, [open, onDoctorSearch]);

  const selectedDoctorLabel = useMemo(
    () => doctorOptions.find((doctor) => doctor.id === selectedDoctorId)?.name,
    [doctorOptions, selectedDoctorId]
  );

  const consultationFee = useMemo(
    () => getConsultationFee(appointmentType),
    [appointmentType]
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
      <DialogContent className="max-h-[92vh] w-[min(96vw,840px)] rounded-xl border border-slate-200 bg-white p-0 shadow-xl sm:max-w-[840px] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-6 py-5 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-slate-900">Book an Appointment</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Select a doctor, choose your preferred date and time, and add your reason for visit.
            </DialogDescription>
          </DialogHeader>

          {/* Content - scrollable */}
          <div className="space-y-5 px-6 py-5 overflow-y-auto flex-1">
            {/* Doctor Selection Section */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Doctor</h3>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="doctor-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search doctors by name or specialization"
                    className="h-10 rounded-lg border-slate-300 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => void handleSearchDoctors()}
                  variant="outline"
                  className="h-10 rounded-lg border-slate-300 px-4 text-sm hover:bg-blue-50"
                  disabled={doctorLoading}
                >
                  {doctorLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Find
                </Button>
              </div>

              {/* Doctor list */}
              <div className="max-h-36 space-y-1.5 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5">
                {doctorOptions.length ? (
                  doctorOptions.map((doctor) => {
                    const active = selectedDoctorId === doctor.id;
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{doctor.name}</p>
                        {doctor.specialization ? (
                          <p className="text-xs text-slate-600 mt-0.5">{doctor.specialization}</p>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-4 text-center text-sm text-slate-600">
                    Search to load available doctors.
                  </p>
                )}
              </div>

              {selectedDoctorLabel ? (
                <p className="text-sm font-medium text-emerald-700">Selected: {selectedDoctorLabel}</p>
              ) : null}
              {doctorError ? (
                <p className="text-sm text-rose-600">{doctorError}</p>
              ) : null}
            </div>

            {/* Appointment Details Section */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Appointment Details</h3>
              
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="appointment-date" className="text-sm font-semibold text-slate-700">
                    Date
                  </Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentDate}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    className={dateTimeInputClass}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-700">Type</Label>
                  <Select
                    value={appointmentType}
                    onValueChange={(value) => setAppointmentType(value as AppointmentType)}
                  >
                    <SelectTrigger className="h-10 rounded-lg border-slate-300 bg-white text-sm text-slate-900">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Consultation Fee Display */}
              <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <DollarSign className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Consultation Fee</p>
                      <p className="text-sm text-blue-700">
                        {appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatFeeAsCurrency(consultationFee)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="start-time" className="text-sm font-semibold text-slate-700">
                    Start
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={dateTimeInputClass}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="end-time" className="text-sm font-semibold text-slate-700">
                    End
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className={dateTimeInputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint Section */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <Label htmlFor="symptoms" className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Reason for Visit
              </Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Describe symptoms or reason..."
                className="min-h-24 rounded-lg border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Validation Error */}
            {validationError ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <p className="font-semibold mb-0.5">Unable to book this appointment</p>
                <p>{validationError}</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg border-slate-300 px-4 text-sm hover:bg-slate-100"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-lg bg-blue-600 px-5 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
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
