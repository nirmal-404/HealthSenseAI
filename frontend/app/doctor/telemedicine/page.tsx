'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, PhoneCall, RefreshCw, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTelemedicinePolling } from '@/hooks/useTelemedicinePolling';
import {
  endTelemedicineSession,
  getTelemedicineSession,
  joinTelemedicineSession,
  listDoctorTelemedicineSessions,
  startTelemedicineSession,
} from '@/lib/telemedicine.api';
import type {
  TelemedicineSession,
  TelemedicineSessionAccess,
  TelemedicineSessionStatus,
} from '@/lib/telemedicine.types';
import { EmbeddedCallDialog } from '@/components/telemedicine/EmbeddedCallDialog';
import { SessionSummaryPanel } from '@/components/telemedicine/SessionSummaryPanel';
import { TelemedicineStatusBadge } from '@/components/telemedicine/TelemedicineStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const PAGE_SIZE = 8;

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
};

const formatAppointmentDate = (value?: string) => {
  if (!value) {
    return 'Date pending';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date pending';
  }

  return parsed.toLocaleDateString();
};

const formatAppointmentTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) {
    return 'Time pending';
  }

  return `${startTime} - ${endTime}`;
};

const getSessionHeadline = (session: TelemedicineSession) => {
  return `${formatAppointmentDate(session.appointmentDate)} • ${formatAppointmentTimeRange(
    session.startTime,
    session.endTime
  )}`;
};

const getParticipantLabel = (session: TelemedicineSession) => {
  return session.patientName || 'Patient consultation';
};

const isJoinableStatus = (status: TelemedicineSessionStatus) =>
  status !== 'completed' && status !== 'failed';

export default function DoctorTelemedicinePage() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TelemedicineSession | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionLoadingById, setActionLoadingById] = useState<Record<string, 'start' | 'join' | 'end' | null>>({});

  const [callOpen, setCallOpen] = useState(false);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [callAccess, setCallAccess] = useState<TelemedicineSessionAccess | null>(null);

  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endTargetSessionId, setEndTargetSessionId] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [endingFromDialog, setEndingFromDialog] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadSessionDetails = useCallback(async (sessionId: string, showLoading = true) => {
    if (showLoading) {
      setDetailsLoading(true);
    }

    try {
      const session = await getTelemedicineSession(sessionId);
      setSelectedSession(session);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load session details.'));
    } finally {
      if (showLoading) {
        setDetailsLoading(false);
      }
    }
  }, []);

  const fetchSessions = useCallback(
    async (showRefreshSpinner = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await listDoctorTelemedicineSessions(user.id, {
          page,
          limit: PAGE_SIZE,
        });
        setSessions(data.items);
        setTotal(data.total);
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to load telemedicine sessions.'));
      } finally {
        if (showRefreshSpinner) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [page, user?.id]
  );

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId(null);
      setSelectedSession(null);
      return;
    }

    if (!selectedSessionId || !sessions.some((session) => session.sessionId === selectedSessionId)) {
      setSelectedSessionId(sessions[0].sessionId);
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }

    void loadSessionDetails(selectedSessionId);
  }, [loadSessionDetails, selectedSessionId]);

  const {
    status: selectedSessionStatus,
    summary: selectedSessionSummary,
    loading: summaryLoading,
    error: summaryError,
    refreshNow: refreshSummaryAndStatus,
  } = useTelemedicinePolling({
    sessionId: selectedSessionId || undefined,
    enabled: Boolean(selectedSessionId),
    fetchSummary: true,
    statusIntervalMs: 5000,
    summaryIntervalMs: 8000,
  });

  const { status: callStatus } = useTelemedicinePolling({
    sessionId: callSessionId || undefined,
    enabled: callOpen && Boolean(callSessionId),
    fetchSummary: false,
    statusIntervalMs: 4000,
  });

  useEffect(() => {
    if (!selectedSessionStatus) {
      return;
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.sessionId === selectedSessionStatus.sessionId
          ? {
              ...session,
              status: selectedSessionStatus.status,
              startedAt: selectedSessionStatus.startedAt,
              endedAt: selectedSessionStatus.endedAt,
            }
          : session
      )
    );

    setSelectedSession((prev) =>
      prev && prev.sessionId === selectedSessionStatus.sessionId
        ? {
            ...prev,
            status: selectedSessionStatus.status,
            startedAt: selectedSessionStatus.startedAt,
            endedAt: selectedSessionStatus.endedAt,
          }
        : prev
    );
  }, [selectedSessionStatus]);

  useEffect(() => {
    if (!selectedSessionSummary || !selectedSessionId) {
      return;
    }

    setSelectedSession((prev) =>
      prev && prev.sessionId === selectedSessionId
        ? {
            ...prev,
            summaryStatus: selectedSessionSummary.summaryStatus,
            soapNote: selectedSessionSummary.soapNote,
            transcript: selectedSessionSummary.transcript,
            summaryError: selectedSessionSummary.error,
          }
        : prev
    );
  }, [selectedSessionId, selectedSessionSummary]);

  const handleStartSession = async (sessionId: string) => {
    setActionLoadingById((prev) => ({ ...prev, [sessionId]: 'start' }));
    try {
      const session = await startTelemedicineSession(sessionId);
      toast.success('Session started.');
      setSessions((prev) => prev.map((item) => (item.sessionId === sessionId ? session : item)));
      if (selectedSessionId === sessionId) {
        setSelectedSession(session);
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to start session.'));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleJoinSession = async (session: TelemedicineSession) => {
    setActionLoadingById((prev) => ({ ...prev, [session.sessionId]: 'join' }));
    try {
      if (session.status === 'scheduled') {
        await startTelemedicineSession(session.sessionId);
      }

      const access = await joinTelemedicineSession(session.sessionId);
      setCallSessionId(session.sessionId);
      setCallAccess(access);
      setCallOpen(true);
      setSelectedSessionId(session.sessionId);
      await loadSessionDetails(session.sessionId, false);
      await fetchSessions(true);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to join session.'));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [session.sessionId]: null }));
    }
  };

  const openEndDialog = (session: TelemedicineSession) => {
    setEndTargetSessionId(session.sessionId);
    setRecordingUrl(session.recordingUrl || '');
    setEndDialogOpen(true);
  };

  const submitEndSession = async () => {
    if (!endTargetSessionId) {
      return;
    }

    setEndingFromDialog(true);
    try {
      await endTelemedicineSession(endTargetSessionId, {
        recordingUrl: recordingUrl.trim() || undefined,
      });
      toast.success('Session ended.');
      setEndDialogOpen(false);
      if (callSessionId === endTargetSessionId) {
        setCallOpen(false);
      }
      await fetchSessions(true);
      if (selectedSessionId === endTargetSessionId) {
        await loadSessionDetails(endTargetSessionId, false);
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to end session.'));
    } finally {
      setEndingFromDialog(false);
    }
  };

  const handleEndFromCall = async () => {
    if (!callSessionId) {
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [callSessionId]: 'end' }));
    try {
      await endTelemedicineSession(callSessionId, {});
      toast.success('Session ended.');
      setCallOpen(false);
      await fetchSessions(true);
      if (selectedSessionId === callSessionId) {
        await loadSessionDetails(callSessionId, false);
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to end session.'));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [callSessionId]: null }));
    }
  };

  const selectedStatus = selectedSessionStatus?.status || selectedSession?.status;

  const selectedSummary = useMemo(
    () =>
      selectedSessionSummary ||
      (selectedSession
        ? {
            summaryStatus: selectedSession.summaryStatus || 'pending',
            soapNote: selectedSession.soapNote,
            transcript: selectedSession.transcript,
            error: selectedSession.summaryError,
          }
        : null),
    [selectedSession, selectedSessionSummary]
  );

  return (
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg text-slate-900">Doctor Sessions</CardTitle>
                <CardDescription>Manage active and upcoming telemedicine consultations.</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={() => void fetchSessions(true)} disabled={refreshing}>
                {refreshing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {loading ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Loading telemedicine sessions...
              </div>
            ) : sessions.length ? (
              sessions.map((session) => {
                const isSelected = session.sessionId === selectedSessionId;
                const actionLoading = actionLoadingById[session.sessionId];
                return (
                  <article
                    key={session.sessionId}
                    className={`rounded-xl border p-4 transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => setSelectedSessionId(session.sessionId)}
                      >
                        <p className="truncate text-sm font-semibold text-slate-900">{getSessionHeadline(session)}</p>
                        <p className="text-xs text-slate-500">{getParticipantLabel(session)}</p>
                      </button>
                      <TelemedicineStatusBadge status={session.status} />
                    </div>

                    <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                      <p className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Created: {formatDateTime(session.createdAt)}
                      </p>
                      <p className="inline-flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                        Type: {(session.appointmentType || 'video').replace('-', ' ')} consultation
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleStartSession(session.sessionId)}
                        disabled={session.status !== 'scheduled' || actionLoading === 'start'}
                      >
                        {actionLoading === 'start' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                        Start
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleJoinSession(session)}
                        disabled={!isJoinableStatus(session.status) || actionLoading === 'join'}
                      >
                        {actionLoading === 'join' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <PhoneCall className="mr-1 h-3.5 w-3.5" />}
                        Join
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => openEndDialog(session)}
                        disabled={session.status !== 'active'}
                      >
                        End
                      </Button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No telemedicine sessions found for this doctor.
              </div>
            )}

            {totalPages > 1 ? (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">Session Details</CardTitle>
              <CardDescription>Live status and room access for the selected session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              {detailsLoading ? <p className="text-slate-500">Loading session details...</p> : null}
              {!detailsLoading && !selectedSession ? (
                <p className="text-slate-500">Select a session to inspect details.</p>
              ) : null}

              {selectedSession ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{getSessionHeadline(selectedSession)}</p>
                    <TelemedicineStatusBadge status={selectedStatus} />
                  </div>
                  <p className="text-xs text-slate-500">Patient: {getParticipantLabel(selectedSession)}</p>
                  <p className="text-xs text-slate-500">
                    Schedule: {formatAppointmentDate(selectedSession.appointmentDate)} at{' '}
                    {formatAppointmentTimeRange(selectedSession.startTime, selectedSession.endTime)}
                  </p>
                  <p className="text-xs text-slate-500">Started: {formatDateTime(selectedSessionStatus?.startedAt || selectedSession.startedAt)}</p>
                  <p className="text-xs text-slate-500">Ended: {formatDateTime(selectedSessionStatus?.endedAt || selectedSession.endedAt)}</p>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleJoinSession(selectedSession)}
                      disabled={!isJoinableStatus(selectedSession.status)}
                    >
                      Join in page
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void loadSessionDetails(selectedSession.sessionId)}
                    >
                      Refresh details
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <SessionSummaryPanel
            summary={selectedSummary}
            loading={summaryLoading}
            error={summaryError}
            onRefresh={() => void refreshSummaryAndStatus()}
          />
        </div>
      </div>

      <EmbeddedCallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        access={callAccess}
        status={callStatus?.status || callAccess?.status}
        allowEndSession
        endingSession={Boolean(callSessionId && actionLoadingById[callSessionId] === 'end')}
        onEndSession={handleEndFromCall}
      />

      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Session</DialogTitle>
            <DialogDescription>
              Optionally attach a recording URL. This will trigger transcript and SOAP summary processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="recording-url">Recording URL (optional)</Label>
            <Input
              id="recording-url"
              placeholder="https://..."
              value={recordingUrl}
              onChange={(event) => setRecordingUrl(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEndDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void submitEndSession()} disabled={endingFromDialog}>
              {endingFromDialog ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
