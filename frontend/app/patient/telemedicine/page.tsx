'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, PhoneCall, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTelemedicinePolling } from '@/hooks/useTelemedicinePolling';
import {
  getTelemedicineSession,
  joinTelemedicineSession,
  listPatientTelemedicineSessions,
} from '@/lib/telemedicine.api';
import type { TelemedicineSession, TelemedicineSessionAccess, TelemedicineSessionStatus } from '@/lib/telemedicine.types';
import { EmbeddedCallDialog } from '@/components/telemedicine/EmbeddedCallDialog';
import { SessionSummaryPanel } from '@/components/telemedicine/SessionSummaryPanel';
import { TelemedicineStatusBadge } from '@/components/telemedicine/TelemedicineStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

const getDoctorLabel = (session: TelemedicineSession) => {
  return session.doctorName || 'Healthcare provider';
};

const isJoinableStatus = (status: TelemedicineSessionStatus) =>
  status !== 'completed' && status !== 'failed';

export default function PatientTelemedicinePage() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TelemedicineSession | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [callAccess, setCallAccess] = useState<TelemedicineSessionAccess | null>(null);

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
        const data = await listPatientTelemedicineSessions(user.id, {
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

  const handleJoinSession = async (session: TelemedicineSession) => {
    setJoiningSessionId(session.sessionId);
    try {
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
      setJoiningSessionId(null);
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
                <CardTitle className="text-lg text-slate-900">My Telemedicine Sessions</CardTitle>
                <CardDescription>Track upcoming and previous telemedicine consultations.</CardDescription>
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
                const joining = joiningSessionId === session.sessionId;

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
                        <p className="text-xs text-slate-500">Doctor: {getDoctorLabel(session)}</p>
                      </button>
                      <TelemedicineStatusBadge status={session.status} />
                    </div>

                    <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                      <p className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Created: {formatDateTime(session.createdAt)}
                      </p>
                      <p className="inline-flex items-center gap-1">
                        Type: {(session.appointmentType || 'video').replace('-', ' ')} consultation
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleJoinSession(session)}
                        disabled={!isJoinableStatus(session.status) || joining}
                      >
                        {joining ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <PhoneCall className="mr-1 h-3.5 w-3.5" />}
                        Join
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSessionId(session.sessionId)}
                      >
                        View Details
                      </Button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No telemedicine sessions found for this patient.
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
              <CardDescription>Room details and live session status for the selected consultation.</CardDescription>
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
                  <p className="text-xs text-slate-500">Doctor: {getDoctorLabel(selectedSession)}</p>
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
      />
    </div>
  );
}
