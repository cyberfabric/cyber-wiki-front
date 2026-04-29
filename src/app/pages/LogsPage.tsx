/**
 * LogsPage — debug diagnostics dashboard.
 *
 * Two sections:
 *   1. Git operations  — backend per-user ring buffer (commit / push / PR).
 *   2. Performance     — frontend in-memory `performanceTracker` metrics.
 *
 * Gated behind Profile → Debug mode in App.tsx routing. The page itself also
 * checks the flag so a stale deep-link redirects rather than rendering for a
 * non-debug user.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, GitCommit, RotateCw, Trash2 } from 'lucide-react';
import { GitOpsLogPanel } from '@/app/components/enrichments/GitOpsLogPanel';
import { PageTitle } from '@/app/layout';
import {
  clearMetrics,
  formatBytes,
  getMetrics,
} from '@/app/lib/performanceTracker';
import { useDebugMode } from '@/app/lib/useDebugMode';
import { Urls } from '@/app/api';

interface LogsPageProps {
  navigate?: (view: string) => void;
}

export default function LogsPage({ navigate }: LogsPageProps) {
  const debugMode = useDebugMode();

  // The hook seeds via loadUserSettings which fires `user/settings/loaded`,
  // so on first render `debugMode` is already false but we don't yet know
  // whether the seed call has completed. Wait one render before redirecting
  // so a debug-on user with cached state isn't bounced to Profile.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSeeded(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (seeded && !debugMode && navigate) {
      navigate(Urls.Profile);
    }
  }, [debugMode, seeded, navigate]);

  if (!debugMode) {
    return (
      <div className="h-full flex flex-col bg-background">
        <PageTitle title="Logs" subtitle="Diagnostics" />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8 text-center">
          Logs page is only available when Debug mode is enabled in your
          Profile.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <PageTitle
        title="Logs"
        subtitle="Diagnostics — git operations and frontend performance metrics"
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
        <Section
          icon={<GitCommit size={14} className="text-muted-foreground" />}
          title="Git operations"
          description="Commit / push / auto-PR results per user, kept in an in-memory ring buffer on the backend (latest 200)."
        >
          <GitOpsLogPanel />
        </Section>

        <Section
          icon={<Activity size={14} className="text-muted-foreground" />}
          title="Performance metrics"
          description="Frontend `performanceTracker` recordings since the last page load. Slow operations (>1s) are highlighted."
        >
          <PerfMetricsPanel />
        </Section>
      </div>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon, title, description, children }: SectionProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// =============================================================================
// PerfMetricsPanel — read-only view of getMetrics() with reload + clear
// =============================================================================

function PerfMetricsPanel() {
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const handleClear = useCallback(() => {
    clearMetrics();
    reload();
  }, [reload]);

  // `tick` is in deps so we re-snapshot getMetrics() whenever the user hits
  // Reload. The tracker module owns the array — we just project it.
  const metrics = useMemo(() => {
    void tick;
    return getMetrics().slice().reverse();
  }, [tick]);

  const summary = useMemo(() => {
    if (metrics.length === 0) {
      return { count: 0, slow: 0, avg: 0, totalSize: 0 };
    }
    let slow = 0;
    let total = 0;
    let totalSize = 0;
    for (const m of metrics) {
      if (m.duration > 1000) slow++;
      total += m.duration;
      totalSize += m.dataSize ?? 0;
    }
    return {
      count: metrics.length,
      slow,
      avg: total / metrics.length,
      totalSize,
    };
  }, [metrics]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-foreground">
          <strong>{summary.count}</strong> records
        </span>
        <span className="text-muted-foreground">
          avg {summary.avg.toFixed(0)}ms
        </span>
        <span className={summary.slow > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'}>
          {summary.slow} slow (&gt;1s)
        </span>
        <span className="text-muted-foreground">
          {formatBytes(summary.totalSize)} total
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={reload}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-background text-foreground hover:bg-accent text-xs"
            title="Re-read in-memory metrics"
          >
            <RotateCw size={11} /> Reload
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={summary.count === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-background text-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 text-xs"
            title="Drop all collected metrics"
          >
            <Trash2 size={11} /> Clear
          </button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="px-3 py-3 text-xs text-muted-foreground italic">
          No metrics recorded yet — interact with pages that call APIs to
          populate.
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 font-medium w-24">Time</th>
                <th className="px-2 py-1.5 font-medium">Operation</th>
                <th className="px-2 py-1.5 font-medium w-20 text-right">ms</th>
                <th className="px-2 py-1.5 font-medium w-20 text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => {
                const isSlow = m.duration > 1000;
                const ts = new Date(m.timestamp);
                return (
                  <tr
                    key={`${m.timestamp}-${m.operation}-${i}`}
                    className={`border-t border-border ${isSlow ? 'bg-yellow-500/10' : ''}`}
                  >
                    <td
                      className="px-2 py-1 text-muted-foreground font-mono"
                      title={ts.toLocaleString()}
                    >
                      {ts.toLocaleTimeString()}
                    </td>
                    <td className="px-2 py-1 font-mono">
                      <span className="text-foreground">{m.operation}</span>
                      {m.url && (
                        <span className="text-muted-foreground ml-1 truncate" title={m.url}>
                          {m.url}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-2 py-1 text-right font-mono ${
                        isSlow
                          ? 'text-yellow-700 dark:text-yellow-400 font-semibold'
                          : 'text-foreground'
                      }`}
                    >
                      {m.duration.toFixed(0)}
                    </td>
                    <td className="px-2 py-1 text-right text-muted-foreground font-mono">
                      {m.dataSize ? formatBytes(m.dataSize) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
