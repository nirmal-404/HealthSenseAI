'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Appointment } from '@/lib/appointments.types';

type CancelAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  submitting?: boolean;
  onConfirm: (appointment: Appointment) => Promise<void>;
};

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  submitting,
  onConfirm,
}: CancelAppointmentDialogProps) {
  const handleConfirm = async () => {
    if (!appointment) {
      return;
    }

    try {
      await onConfirm(appointment);
      onOpenChange(false);
    } catch {
      // Parent handles toasts.
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg border border-slate-200 bg-white p-0 max-w-md">
        <div className="bg-rose-50 border-b border-slate-200 px-6 py-5 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900 mb-0">
              Cancel Appointment?
            </AlertDialogTitle>
          </div>
        </div>

        <div className="px-6 py-5">
          <AlertDialogDescription className="text-slate-700 mb-4">
            You're about to cancel this appointment. This action cannot be easily reversed.
          </AlertDialogDescription>
          
          {appointment && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-slate-900">Date:</span>{' '}
                  <span className="text-slate-600">{appointment.appointmentDate}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Time:</span>{' '}
                  <span className="text-slate-600">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600">
            The appointment will be marked as cancelled and you will not be able to attend it. If you need to reschedule instead, use the reschedule option.
          </p>
        </div>

        <AlertDialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4 gap-2">
          <AlertDialogCancel className="rounded-lg border-slate-300 hover:bg-slate-100" disabled={submitting}>
            Keep Appointment
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Appointment'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
