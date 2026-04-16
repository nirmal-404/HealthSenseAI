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
      <DialogContent className="max-w-md rounded-2xl border border-[#dce5f2] bg-white p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-[#e6edf8] px-5 py-4">
            <DialogTitle className="text-lg font-semibold text-[#1f2a44]">Reschedule Appointment</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Update appointment date and time. Status will return to pending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Date
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
                className="h-10 rounded-xl border-[#dce5f2] bg-[#f9fbff]"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reschedule-start-time" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Start time
                </Label>
                <Input
                  id="reschedule-start-time"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="h-10 rounded-xl border-[#dce5f2] bg-[#f9fbff]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reschedule-end-time" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  End time
                </Label>
                <Input
                  id="reschedule-end-time"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="h-10 rounded-xl border-[#dce5f2] bg-[#f9fbff]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reschedule-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes (optional)
              </Label>
              <Textarea
                id="reschedule-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a reason for rescheduling"
                className="min-h-[88px] rounded-xl border-[#dce5f2] bg-[#f9fbff]"
              />
            </div>

            {validationError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {validationError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="rounded-b-2xl border-t border-[#e6edf8] bg-[#f8fbff] p-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-[#dce5f2]"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Close
            </Button>
            <Button type="submit" className="rounded-xl bg-[#3559d5] text-white hover:bg-[#2d4db9]" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
