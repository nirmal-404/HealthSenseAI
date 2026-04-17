'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getTelemedicineSessionStatus,
  getTelemedicineSessionSummary,
} from '@/lib/telemedicine.api';
import type {
  TelemedicineSessionStatusResponse,
  TelemedicineSessionSummaryResponse,
} from '@/lib/telemedicine.types';

const TERMINAL_SUMMARY_STATUSES = new Set<TelemedicineSessionSummaryResponse['summaryStatus']>([
  'completed',
  'failed',
  'skipped',
]);

type UseTelemedicinePollingOptions = {
  sessionId?: string;
  enabled?: boolean;
  fetchSummary?: boolean;
  statusIntervalMs?: number;
  summaryIntervalMs?: number;
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export function useTelemedicinePolling({
  sessionId,
  enabled = true,
  fetchSummary = false,
  statusIntervalMs = 5000,
  summaryIntervalMs = 8000,
}: UseTelemedicinePollingOptions) {
  const [status, setStatus] = useState<TelemedicineSessionStatusResponse | null>(null);
  const [summary, setSummary] = useState<TelemedicineSessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryTerminal, setSummaryTerminal] = useState(false);

  useEffect(() => {
    setStatus(null);
    setSummary(null);
    setSummaryTerminal(false);
    setError(null);
  }, [sessionId]);

  const refreshStatus = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    const result = await getTelemedicineSessionStatus(sessionId);
    setStatus(result);
  }, [sessionId]);

  const refreshSummary = useCallback(async () => {
    if (!sessionId || !fetchSummary) {
      return;
    }

    const result = await getTelemedicineSessionSummary(sessionId);
    setSummary(result);

    if (TERMINAL_SUMMARY_STATUSES.has(result.summaryStatus)) {
      setSummaryTerminal(true);
    }
  }, [fetchSummary, sessionId]);

  const refreshNow = useCallback(async () => {
    if (!enabled || !sessionId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await refreshStatus();
      if (fetchSummary) {
        await refreshSummary();
      }
    } catch (pollError: any) {
      setError(getErrorMessage(pollError, 'Unable to refresh telemedicine session.'));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchSummary, refreshStatus, refreshSummary, sessionId]);

  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    void refreshNow();

    const statusTimer = window.setInterval(() => {
      void refreshStatus().catch((pollError: any) => {
        setError(getErrorMessage(pollError, 'Unable to refresh session status.'));
      });
    }, statusIntervalMs);

    return () => {
      window.clearInterval(statusTimer);
    };
  }, [enabled, refreshNow, refreshStatus, sessionId, statusIntervalMs]);

  useEffect(() => {
    if (!enabled || !sessionId || !fetchSummary || summaryTerminal) {
      return;
    }

    const summaryTimer = window.setInterval(() => {
      void refreshSummary().catch((pollError: any) => {
        setError(getErrorMessage(pollError, 'Unable to refresh session summary.'));
      });
    }, summaryIntervalMs);

    return () => {
      window.clearInterval(summaryTimer);
    };
  }, [enabled, fetchSummary, refreshSummary, sessionId, summaryIntervalMs, summaryTerminal]);

  return {
    status,
    summary,
    loading,
    error,
    refreshNow,
  };
}
