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
      <DialogContent className="max-h-[95vh] w-[min(96vw,750px)] rounded-lg border border-slate-200 bg-white p-0 shadow-lg sm:max-w-[750px] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-5 py-3 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-slate-900">Book an Appointment</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-600">
              Select doctor, date, time, and type of consultation
            </DialogDescription>
          </DialogHeader>

          {/* Content - scrollable */}
          <div className="space-y-3 px-5 py-4 overflow-y-auto flex-1">
            {/* Doctor Selection Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 uppercase">Healthcare Provider</h3>
              
              <div className="flex gap-1.5">
                <Input
                  id="doctor-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search doctors..."
                  className="flex-1 h-8 text-xs rounded-lg border-slate-300 bg-white"
                />
                <Button
                  type="button"
                  onClick={() => void handleSearchDoctors()}
                  variant="outline"
                  className="h-8 px-2 rounded-lg border-slate-300 hover:bg-blue-50"
                  disabled={doctorLoading}
                >
                  {doctorLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Search className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Doctor list */}
              <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                {doctorOptions.length ? (
                  doctorOptions.map((doctor) => {
                    const active = selectedDoctorId === doctor.id;
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={`w-full rounded-lg border-2 px-3 py-1.5 text-left transition text-xs ${
                          active
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 text-xs">{doctor.name}</p>
                        {doctor.specialization ? (
                          <p className="text-xs text-slate-600">{doctor.specialization}</p>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-100 px-2 py-3 text-center text-xs text-slate-600">
                    Search for doctors
                  </p>
                )}
              </div>

              {selectedDoctorLabel ? (
                <p className="text-xs font-medium text-emerald-600">✓ {selectedDoctorLabel}</p>
              ) : null}
              {doctorError ? (
                <p className="text-xs text-rose-600">⚠ {doctorError}</p>
              ) : null}
            </div>

            {/* Appointment Details Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 uppercase">Appointment Details</h3>
              
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="appointment-date" className="text-xs font-semibold text-slate-700">
                    Date
                  </Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentDate}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    className="h-8 text-xs rounded-lg border-slate-300 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Type</Label>
                  <Select
                    value={appointmentType}
                    onValueChange={(value) => setAppointmentType(value as AppointmentType)}
                  >
                    <SelectTrigger className="h-8 text-xs rounded-lg border-slate-300 bg-white text-slate-900">
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
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">Fee</p>
                      <p className="text-xs text-blue-600">
                        {appointmentType === 'video' ? 'Video' : 'In-Person'}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-blue-700">{formatFeeAsCurrency(consultationFee)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="start-time" className="text-xs font-semibold text-slate-700">
                    Start
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-8 text-xs rounded-lg border-slate-300 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="end-time" className="text-xs font-semibold text-slate-700">
                    End
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="h-8 text-xs rounded-lg border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint Section */}
            <div className="space-y-1">
              <Label htmlFor="symptoms" className="text-xs font-semibold text-slate-700 uppercase">
                Reason for Visit
              </Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Describe symptoms or reason..."
                className="min-h-16 text-xs rounded-lg border-slate-300 bg-white resize-none"
              />
            </div>

            {/* Validation Error */}
            {validationError ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <p className="font-semibold mb-0.5">Unable to book</p>
                <p>{validationError}</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-5 py-3 sm:justify-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-300 text-xs hover:bg-slate-100 h-8 px-3"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:bg-blue-400 h-8 px-4"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
