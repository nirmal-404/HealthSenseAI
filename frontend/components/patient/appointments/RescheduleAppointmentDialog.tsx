'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Appointment, RescheduleAppointmentPayload } from '@/lib/appointments.types';
import { isPastDate, isValidTimeRange } from '@/lib/appointments.utils';

type RescheduleAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  submitting?: boolean;
  onSubmit: (appointmentId: string, payload: RescheduleAppointmentPayload) => Promise<void>;
};

const toDateInput = (value: string | undefined) => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0];
};

export function RescheduleAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  submitting,
  onSubmit,
}: RescheduleAppointmentDialogProps) {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !appointment) {
      return;
    }

    setAppointmentDate(toDateInput(appointment.appointmentDate));
    setStartTime(appointment.startTime || '');
    setEndTime(appointment.endTime || '');
    setNotes('');
    setValidationError(null);
  }, [open, appointment]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!appointment) {
      return;
    }

    if (isPastDate(appointmentDate)) {
      setValidationError('Rescheduled date must be today or a future date.');
      return;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      setValidationError('End time must be later than start time.');
      return;
    }

    setValidationError(null);

    try {
      await onSubmit(appointment.appointmentId, {
        appointmentDate,
        startTime,
        endTime,
        notes: notes.trim(),
      });
      onOpenChange(false);
    } catch {
      // Parent handles toasts.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg border border-slate-200 bg-white p-0">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
            <DialogTitle className="text-xl font-bold text-slate-900">Reschedule Appointment</DialogTitle>
            <DialogDescription className="mt-1 text-slate-600">
              Choose a new date and time for your appointment. The status will be updated to pending.
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date" className="text-sm font-semibold text-slate-700">
                New Date
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
                className="h-10 rounded-lg border-slate-300 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule-start-time" className="text-sm font-semibold text-slate-700">
                  Start Time
                </Label>
                <Input
                  id="reschedule-start-time"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="h-10 rounded-lg border-slate-300 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-end-time" className="text-sm font-semibold text-slate-700">
                  End Time
                </Label>
                <Input
                  id="reschedule-end-time"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="h-10 rounded-lg border-slate-300 bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule-notes" className="text-sm font-semibold text-slate-700">
                Notes (Optional)
              </Label>
              <Textarea
                id="reschedule-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a reason for rescheduling..."
                className="min-h-20 rounded-lg border-slate-300 bg-white resize-none"
              />
            </div>

            {validationError ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <p className="font-semibold mb-1">Cannot reschedule</p>
                <p>{validationError}</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-300 hover:bg-slate-100"
              onClick={() => onOpenChange(false)}
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
