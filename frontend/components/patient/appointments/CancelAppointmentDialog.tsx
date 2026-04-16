'use client';

import { Loader2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
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
      <AlertDialogContent className="rounded-2xl border border-[#dce5f2] bg-white">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-rose-50 text-rose-600">
            <TriangleAlert className="h-5 w-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark appointment <span className="font-medium">{appointment?.appointmentId}</span> as
            cancelled. This action can’t be undone from the patient page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Keep appointment</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel appointment'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
