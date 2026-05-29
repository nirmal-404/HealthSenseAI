import { ExternalLink, Loader2, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TelemedicineStatusBadge } from '@/components/telemedicine/TelemedicineStatusBadge';
import type { TelemedicineSessionAccess, TelemedicineSessionStatus } from '@/lib/telemedicine.types';

type EmbeddedCallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  access: TelemedicineSessionAccess | null;
  status?: TelemedicineSessionStatus | string;
  allowEndSession?: boolean;
  endingSession?: boolean;
  onEndSession?: () => Promise<void> | void;
};

export function EmbeddedCallDialog({
  open,
  onOpenChange,
  access,
  status,
  allowEndSession = false,
  endingSession = false,
  onEndSession,
}: EmbeddedCallDialogProps) {
  const callUrl = access?.jitsiUrl || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] p-0 sm:max-w-6xl" showCloseButton>
        <DialogHeader className="border-b border-slate-200 px-5 pb-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base text-slate-900">Live Telemedicine Call</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Secure room connected for this consultation.
              </DialogDescription>
            </div>
            <TelemedicineStatusBadge status={status || access?.status} />
          </div>
        </DialogHeader>

        <div className="p-4">
          {callUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <div className="aspect-video w-full">
                <iframe
                  src={callUrl}
                  title="Telemedicine session"
                  className="h-full w-full border-0"
                  allow="camera; microphone; fullscreen; display-capture"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Unable to load the session room URL.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50">
          {callUrl ? (
            <Button variant="outline" asChild>
              <a href={callUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Open in new tab
              </a>
            </Button>
          ) : null}

          {allowEndSession && onEndSession ? (
            <Button variant="destructive" onClick={() => void onEndSession()} disabled={endingSession}>
              {endingSession ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <PhoneOff className="mr-1 h-3.5 w-3.5" />}
              End session
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
