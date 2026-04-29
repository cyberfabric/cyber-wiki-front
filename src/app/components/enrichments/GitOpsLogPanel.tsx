/**
 * GitOpsLogPanel — debug viewer for the per-user git operations ring-buffer.
 *
 * Pulls /api/wiki/v1/git-ops-log/, renders newest-first. Drives the "what
 * just happened with my commit / PR?" question that the user otherwise has
 * to answer by tailing server logs. Rendered inside the Debug tab of
 * EnrichmentPanel — gating is handled by the caller.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiRegistry } from '@cyberfabric/react';
import { Check, Loader2, RotateCw, Trash2, X } from 'lucide-react';
import { GitOpsLogApiService, type GitOpsLogEntry } from '@/app/api';

interface GitOpsLogPanelProps {
  /** Optional space slug — when set, entries are filtered down to that
   *  space. Helps keep the panel useful when the user has many spaces. */
  spaceSlug?: string;
}

export function GitOpsLogPanel({ spaceSlug }: GitOpsLogPanelProps) {
  const [entries, setEntries] = useState<GitOpsLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const service = apiRegistry.getService(GitOpsLogApiService);
      const result = await service.list({ limit: 100 });
      setEntries(result.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleClear = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      const service = apiRegistry.getService(GitOpsLogApiService);
      await service.clear();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setClearing(false);
    }
  };

  const filtered = spaceSlug
    ? entries.filter((e) => e.space_slug === spaceSlug)
    : entries;

  return (
    <details open className="border border-border rounded-md bg-muted">
      <summary className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs font-medium text-foreground select-none">
        <span className="flex-1 truncate">Git ops ({filtered.length})</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            void reload();
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Reload"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <RotateCw size={11} />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            void handleClear();
          }}
          disabled={clearing || filtered.length === 0}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive disabled:opacity-40"
          title="Clear my log"
        >
          <Trash2 size={11} />
        </button>
      </summary>

      <div className="border-t border-border bg-background">
        {error && (
          <div className="px-3 py-2 text-xs text-destructive break-words">
            {error}
          </div>
        )}
        {!error && filtered.length === 0 && !loading && (
          <div className="px-3 py-3 text-xs text-muted-foreground italic">
            No git operations recorded yet — commit or open a PR to populate.
          </div>
        )}
        {filtered.length > 0 && (
          <ul className="divide-y divide-border">
            {filtered.map((entry, i) => (
              <GitOpsLogRow key={`${entry.ts}-${entry.kind}-${i}`} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

function GitOpsLogRow({ entry }: { entry: GitOpsLogEntry }) {
  const ts = entry.ts ? new Date(entry.ts * 1000) : null;
  const tsLabel = ts && !Number.isNaN(ts.getTime()) ? ts.toLocaleTimeString() : '—';
  const tsTitle = ts && !Number.isNaN(ts.getTime()) ? ts.toLocaleString() : '';
  const isError = entry.status === 'error';
  const isOk = entry.status === 'ok';
  const payloadJson = JSON.stringify(entry.payload ?? {}, null, 2);
  const hasPayload = payloadJson !== '{}';

  return (
    <li className="px-3 py-2 text-[11px] leading-snug">
      <div className="flex items-center gap-2 mb-0.5">
        <StatusIcon status={entry.status} />
        <code className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">
          {entry.kind || '?'}
        </code>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            isError
              ? 'bg-destructive/10 text-destructive'
              : isOk
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
          }`}
        >
          {entry.status}
        </span>
        {entry.space_slug && (
          <span className="text-muted-foreground truncate" title={entry.space_slug}>
            {entry.space_slug}
          </span>
        )}
        {entry.branch_name && (
          <code className="text-muted-foreground/80 truncate" title={entry.branch_name}>
            {entry.branch_name}
          </code>
        )}
        <span className="ml-auto text-muted-foreground" title={tsTitle}>
          {tsLabel}
        </span>
      </div>
      {entry.message && (
        <div className="text-foreground whitespace-pre-wrap break-words">
          {entry.message}
        </div>
      )}
      {hasPayload && (
        <details className="mt-1">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
            payload
          </summary>
          <pre className="mt-1 p-2 rounded bg-muted text-[10px] font-mono whitespace-pre-wrap break-words">
            {payloadJson}
          </pre>
        </details>
      )}
    </li>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok') return <Check size={11} className="text-green-600 flex-shrink-0" />;
  if (status === 'error') return <X size={11} className="text-destructive flex-shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />;
}
