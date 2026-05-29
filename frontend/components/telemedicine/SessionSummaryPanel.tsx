import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TelemedicineSessionSummaryResponse } from '@/lib/telemedicine.types';

type SessionSummaryPanelProps = {
  summary: TelemedicineSessionSummaryResponse | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

const summaryStatusClasses: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  skipped: 'bg-slate-100 text-slate-700 border border-slate-200',
  failed: 'bg-rose-100 text-rose-700 border border-rose-200',
};

function SummaryStatusBadge({ status }: { status?: string }) {
  const safeStatus = String(status || 'pending').toLowerCase();
  const label = safeStatus.slice(0, 1).toUpperCase() + safeStatus.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        summaryStatusClasses[safeStatus] || summaryStatusClasses.pending
      }`}
    >
      {label}
    </span>
  );
}

export function SessionSummaryPanel({ summary, loading = false, error, onRefresh }: SessionSummaryPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Clinical Summary</h3>
          <p className="text-xs text-slate-500">Transcription and SOAP note generated after session end.</p>
        </div>
        <div className="flex items-center gap-2">
          <SummaryStatusBadge status={summary?.summaryStatus} />
          {onRefresh ? (
            <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-500">Refreshing summary...</p> : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {!summary ? (
        <p className="text-sm text-slate-500">Select a session to load summary details.</p>
      ) : null}

      {summary?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {summary.error}
        </div>
      ) : null}

      {summary?.soapNote ? (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Subjective</p>
            <p className="mt-1 text-sm text-slate-700">{summary.soapNote.subjective}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Objective</p>
            <p className="mt-1 text-sm text-slate-700">{summary.soapNote.objective}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assessment</p>
            <p className="mt-1 text-sm text-slate-700">{summary.soapNote.assessment}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Plan</p>
            <p className="mt-1 text-sm text-slate-700">{summary.soapNote.plan}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Follow-up Date</p>
            <p className="mt-1 text-sm text-slate-700">{summary.soapNote.followUpDate || 'Not specified'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Urgency</p>
            <p className="mt-1 text-sm text-slate-700">{summary.soapNote.urgencyLevel}</p>
          </div>
        </div>
      ) : null}

      {summary?.transcript ? (
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-600">
            Transcript
          </summary>
          <p className="mt-2 max-h-44 overflow-y-auto text-sm text-slate-700">{summary.transcript}</p>
        </details>
      ) : null}
    </div>
  );
}
