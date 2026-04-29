/**
 * ChangesPage — global list of every pending draft change the user has made
 * across all spaces. Click a row → navigate into the space + open the file.
 *
 * Per FR cpt-cyberwiki-fr-pending-changes — gives a single inbox for in-flight
 * edits without forcing the user to open every file individually.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { eventBus, apiRegistry } from '@cyberfabric/react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Loader2,
  MoreHorizontal,
  Plus,
  Minus,
  RotateCw,
  Undo2,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '@/app/components/primitives/ConfirmDialog';
import {
  commitDrafts,
  discardDraft,
  loadDrafts,
} from '@/app/actions/draftChangeActions';
import { createPullRequest, unstageBranch } from '@/app/actions/userBranchActions';
import { PageTitle } from '@/app/layout';
import {
  EditChangeType,
  GitOpsLogApiService,
  PRStatus,
  Urls,
  type DraftChangeListItem,
  type GitOpsLogEntry,
} from '@/app/api';

interface ChangesPageProps {
  navigate: (view: string) => void;
}

interface SpaceGroup {
  spaceSlug: string;
  drafts: DraftChangeListItem[];
}

function changeIcon(type: EditChangeType) {
  if (type === EditChangeType.Create) return <Plus size={14} className="text-green-600" />;
  if (type === EditChangeType.Delete) return <Minus size={14} className="text-red-600" />;
  return <Edit3 size={14} className="text-blue-600" />;
}

function changeBadgeClasses(type: EditChangeType) {
  if (type === EditChangeType.Create) {
    return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300';
  }
  if (type === EditChangeType.Delete) {
    return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300';
  }
  return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';
}

function groupBySpace(drafts: DraftChangeListItem[]): SpaceGroup[] {
  const map = new Map<string, SpaceGroup>();
  for (const d of drafts) {
    const key = d.space_slug || d.space_id;
    let group = map.get(key);
    if (!group) {
      group = { spaceSlug: key, drafts: [] };
      map.set(key, group);
    }
    group.drafts.push(d);
  }
  for (const g of map.values()) {
    g.drafts.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  return Array.from(map.values()).sort((a, b) => a.spaceSlug.localeCompare(b.spaceSlug));
}

function ChangesPage({ navigate }: ChangesPageProps) {
  const [drafts, setDrafts] = useState<DraftChangeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EditChangeType | 'all'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState<DraftChangeListItem | null>(null);
  const [pendingDiscardSelected, setPendingDiscardSelected] = useState(false);
  /** Outcome of the auto-PR step that runs alongside every commit. Drives a
   *  single banner with the right copy per state — `created` / `existing` /
   *  `failed` / `not_attempted`. Picking the right wording from the
   *  (pr, pr_error) tuple alone is ambiguous, so the backend tells us. */
  const [lastCommitPr, setLastCommitPr] = useState<
    | {
        status: PRStatus;
        url: string | null;
        branch: string;
        error: string | null;
        spaceId: string;
        retrying: boolean;
      }
    | null
  >(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const loadedSub = eventBus.on('wiki/drafts/loaded', ({ drafts: list }) => {
      setDrafts(list);
      setLoading(false);
    });
    const errorSub = eventBus.on('wiki/draft/error', ({ error: msg }) => {
      setError(msg);
      setLoading(false);
      setBusy(false);
    });
    // Refresh after server-acked mutations.
    const refresh = () => {
      setBusy(false);
      loadDrafts();
    };
    const mutationSubs = [
      eventBus.on('wiki/draft/discarded', refresh),
      eventBus.on('wiki/draft/committed', ({ pr, prError, prStatus, branchName, spaceId }) => {
        setSelected(new Set());
        setCommitMessage('');
        setLastCommitPr({
          status: prStatus ?? (pr ? PRStatus.Existing : PRStatus.NotAttempted),
          url: pr?.prUrl ?? null,
          branch: branchName,
          error: prError ?? null,
          spaceId,
          retrying: false,
        });
        refresh();
      }),
      // Retry-PR success — flip the banner from Failed → Created with the new URL.
      eventBus.on('wiki/pr/created', ({ result }) => {
        setLastCommitPr((prev) =>
          prev && prev.retrying
            ? { ...prev, status: PRStatus.Created, url: result.pr_url, error: null, retrying: false }
            : prev,
        );
      }),
      // Retry-PR failure — keep the banner on Failed, refresh the error text.
      eventBus.on('wiki/branch/error', ({ error: msg }) => {
        setLastCommitPr((prev) =>
          prev && prev.retrying
            ? { ...prev, status: PRStatus.Failed, error: msg, retrying: false }
            : prev,
        );
      }),
    ];
    loadDrafts();
    return () => {
      loadedSub.unsubscribe();
      errorSub.unsubscribe();
      mutationSubs.forEach((s) => s.unsubscribe());
    };
  }, []);

  const groups = useMemo(() => {
    const filtered = drafts.filter((d) => {
      if (typeFilter !== 'all' && d.change_type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !d.file_path.toLowerCase().includes(q) &&
          !d.space_slug.toLowerCase().includes(q) &&
          !(d.description || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
    return groupBySpace(filtered);
  }, [drafts, search, typeFilter]);

  const total = drafts.length;
  const filteredTotal = groups.reduce((sum, g) => sum + g.drafts.length, 0);
  const visibleIds = useMemo(
    () => groups.flatMap((g) => g.drafts.map((d) => d.id)),
    [groups],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  /** Number of distinct spaces the selection touches — Commit will fan-out
   *  into that many backend requests (one per space). */
  const selectedSpaceCount = useMemo(() => {
    const set = new Set<string>();
    for (const d of drafts) {
      if (selected.has(d.id)) set.add(d.space_id);
    }
    return set.size;
  }, [drafts, selected]);

  const toggleGroup = (slug: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleIds));
  };

  /** Selection state for one space group: 'none' / 'some' / 'all'. Drives
   *  the tristate checkbox in the group header. */
  const groupSelectionState = (group: SpaceGroup): 'none' | 'some' | 'all' => {
    let selectedCount = 0;
    for (const d of group.drafts) {
      if (selected.has(d.id)) selectedCount++;
    }
    if (selectedCount === 0) return 'none';
    if (selectedCount === group.drafts.length) return 'all';
    return 'some';
  };

  /** Toggle every draft in a group: if any are unselected, select them all;
   *  if all are already selected, deselect them all. */
  const toggleGroupSelection = (group: SpaceGroup) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const state = groupSelectionState(group);
      if (state === 'all') {
        for (const d of group.drafts) next.delete(d.id);
      } else {
        for (const d of group.drafts) next.add(d.id);
      }
      return next;
    });
  };

  const handleOpen = (group: SpaceGroup, draft: DraftChangeListItem) => {
    const params = new URLSearchParams({
      space: group.spaceSlug,
      file: draft.file_path,
    });
    navigate(`${Urls.Spaces}?${params.toString()}`);
  };

  const handleCommitSelected = () => {
    if (selected.size === 0) return;
    // Backend rejects empty commit messages with a 500. Require non-empty
    // here so the user gets clear inline feedback instead of a server crash.
    const message = commitMessage.trim();
    if (!message) {
      setError('Commit message is required.');
      return;
    }
    setBusy(true);
    setError(null);
    // Backend requires all change_ids in a single commit request to belong to
    // the same space — issue one request per space so a multi-repo selection
    // turns into one commit per repo.
    const idsBySpace = new Map<string, string[]>();
    for (const d of drafts) {
      if (!selected.has(d.id)) continue;
      const list = idsBySpace.get(d.space_id) ?? [];
      list.push(d.id);
      idsBySpace.set(d.space_id, list);
    }
    for (const ids of idsBySpace.values()) {
      commitDrafts(ids, message);
    }
  };

  const handleDiscardOne = (d: DraftChangeListItem) => {
    setBusy(true);
    discardDraft(d.id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(d.id);
      return next;
    });
  };

  const handleDiscardSelected = () => {
    if (selected.size === 0) return;
    setBusy(true);
    for (const id of selected) {
      discardDraft(id);
    }
    setSelected(new Set());
  };

  return (
    <div className="h-full overflow-auto">
      <ConfirmDialog
        open={pendingDiscard !== null}
        title="Discard draft?"
        message={
          pendingDiscard
            ? `Discard pending change to "${pendingDiscard.file_path}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Discard"
        danger
        onConfirm={() => {
          if (pendingDiscard) handleDiscardOne(pendingDiscard);
          setPendingDiscard(null);
        }}
        onCancel={() => setPendingDiscard(null)}
      />
      <ConfirmDialog
        open={pendingDiscardSelected}
        title="Discard selected drafts?"
        message={`${selected.size} pending change${selected.size === 1 ? '' : 's'} will be discarded. This cannot be undone.`}
        confirmLabel="Discard"
        danger
        onConfirm={() => {
          handleDiscardSelected();
          setPendingDiscardSelected(false);
        }}
        onCancel={() => setPendingDiscardSelected(false)}
      />
      <PageTitle title="Changes" subtitle="All pending edits across the spaces you contribute to." />
      <div className="max-w-7xl p-6 space-y-4">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EditChangeType | 'all')}
              className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
            >
              <option value="all">All types</option>
              <option value={EditChangeType.Modify}>Modified</option>
              <option value={EditChangeType.Create}>Created</option>
              <option value={EditChangeType.Delete}>Deleted</option>
            </select>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by file path, space, or description…"
          className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {loading && (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-destructive/20 text-destructive/70 hover:text-destructive"
              title="Dismiss"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {lastCommitPr && (
          <CommitPrBanner
            status={lastCommitPr.status}
            url={lastCommitPr.url}
            branch={lastCommitPr.branch}
            error={lastCommitPr.error}
            retrying={lastCommitPr.retrying}
            onRetry={() => {
              setLastCommitPr((prev) => (prev ? { ...prev, retrying: true } : prev));
              createPullRequest({ spaceId: lastCommitPr.spaceId });
            }}
            onDismiss={() => setLastCommitPr(null)}
          />
        )}

        {!loading && !error && total === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Edit3 size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No pending changes.</p>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-muted-foreground">
                {filteredTotal === total
                  ? `${total} change${total === 1 ? '' : 's'}`
                  : `${filteredTotal} of ${total} shown`}
                {selected.size > 0 && ` · ${selected.size} selected`}
                {selectedSpaceCount > 1 && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                    · spans {selectedSpaceCount} repos — Commit will create one commit per repo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded text-muted-foreground hover:bg-accent"
                  disabled={visibleIds.length === 0}
                >
                  {allVisibleSelected ? <Check size={12} /> : <Square size={12} />}
                  {allVisibleSelected ? 'Deselect all' : 'Select all'}
                </button>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message (required)"
                  className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground w-56"
                  disabled={selected.size === 0 || busy}
                  required
                />
                <button
                  type="button"
                  onClick={handleCommitSelected}
                  disabled={selected.size === 0 || busy || !commitMessage.trim()}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
                  title={
                    !commitMessage.trim()
                      ? 'Enter a commit message first'
                      : 'Commit selected drafts'
                  }
                >
                  <GitCommit size={12} />
                  Commit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDiscardSelected(true)}
                  disabled={selected.size === 0 || busy}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                  title="Discard selected drafts"
                >
                  <Trash2 size={12} />
                  Discard
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {groups.map((group) => {
                const isOpen = expandedGroups.has(group.spaceSlug);
                const groupState = groupSelectionState(group);
                const groupCheckboxIcon =
                  groupState === 'all' ? (
                    <Check size={14} className="text-green-600" />
                  ) : groupState === 'some' ? (
                    <Minus size={14} className="text-primary" />
                  ) : (
                    <Square size={14} className="text-muted-foreground" />
                  );
                return (
                  <div
                    key={group.spaceSlug}
                    className="border border-border rounded-lg bg-card overflow-hidden"
                  >
                    {/* Group header row — split into a select-all checkbox
                        and an expand/collapse toggle so the user can pick
                        every draft in one repo without picking every draft
                        on the page. */}
                    <div className="flex items-center gap-2 px-4 py-2 hover:bg-accent/50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupSelection(group);
                        }}
                        title={
                          groupState === 'all'
                            ? `Deselect all in ${group.spaceSlug}`
                            : `Select all in ${group.spaceSlug}`
                        }
                        className="p-0.5 rounded hover:bg-accent flex-shrink-0"
                      >
                        {groupCheckboxIcon}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.spaceSlug)}
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                      >
                        {isOpen ? (
                          <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                        )}
                        <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate flex-1">
                          {group.spaceSlug}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {group.drafts.length}
                        </span>
                      </button>
                    </div>

                    {isOpen && (
                      <ul className="divide-y divide-border border-t border-border">
                        {group.drafts.map((d) => {
                          const isSelected = selected.has(d.id);
                          return (
                            <li key={d.id}>
                              <div
                                className={`flex items-start gap-2 px-4 py-3 hover:bg-accent/40 ${
                                  isSelected ? 'bg-primary/5' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleOne(d.id)}
                                  className="p-0.5 rounded hover:bg-accent flex-shrink-0 mt-0.5"
                                  title={isSelected ? 'Deselect' : 'Select'}
                                >
                                  {isSelected ? (
                                    <Check size={14} className="text-green-600" />
                                  ) : (
                                    <Square size={14} className="text-muted-foreground" />
                                  )}
                                </button>
                                <div className="flex-shrink-0 pt-0.5">
                                  {changeIcon(d.change_type)}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpen(group, d)}
                                  className="flex-1 min-w-0 text-left"
                                >
                                  <div className="flex items-center gap-2 mb-0.5 text-sm">
                                    <span className="text-foreground truncate flex-1 hover:underline">
                                      {d.file_path}
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded ${changeBadgeClasses(d.change_type)}`}
                                    >
                                      {d.change_type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{new Date(d.updated_at).toLocaleString()}</span>
                                    {d.branch_id && <span>· branch {d.branch_id.slice(0, 7)}</span>}
                                    {d.description && (
                                      <span className="truncate">· {d.description}</span>
                                    )}
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDiscard(d)}
                                  disabled={busy}
                                  className="p-1 rounded text-destructive hover:bg-destructive/10 flex-shrink-0 disabled:opacity-40"
                                  title="Discard this draft"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        <RecentCommitsPanel />
      </div>
    </div>
  );
}

// =============================================================================
// RecentCommitsPanel — past commits from git-ops-log with PR status
// =============================================================================

interface CommitEntry {
  ts: number;
  message: string;
  spaceSlug: string;
  spaceId: string | null;
  branch: string;
  sha: string | null;
  filesCommitted: number;
  status: string;
  pr: { url: string; status: 'created' | 'existing' | 'failed' | 'none' } | null;
  prError: string | null;
}

function buildCommitEntries(entries: GitOpsLogEntry[]): CommitEntry[] {
  const commits: CommitEntry[] = [];
  const prByBranch = new Map<string, GitOpsLogEntry>();

  for (const e of entries) {
    if (e.kind === 'pr.create.auto') {
      const key = `${e.space_slug}/${e.branch_name}`;
      if (!prByBranch.has(key)) prByBranch.set(key, e);
    }
  }

  for (const e of entries) {
    if (e.kind !== 'commit') continue;
    const branchKey = `${e.space_slug}/${e.branch_name}`;
    const prEntry = prByBranch.get(branchKey);
    let pr: CommitEntry['pr'] = null;
    let prError: string | null = null;

    if (prEntry) {
      if (prEntry.status === 'ok') {
        const prUrl = (prEntry.payload?.pr_url as string) || '';
        pr = {
          url: prUrl,
          status: prEntry.message?.toLowerCase().includes('existing') ? 'existing' : 'created',
        };
      } else if (prEntry.status === 'error') {
        pr = { url: '', status: 'failed' };
        prError = prEntry.message || 'PR creation failed';
      }
    }

    commits.push({
      ts: e.ts,
      message: e.message,
      spaceSlug: e.space_slug,
      spaceId: (e.payload?.space_id as string) || null,
      branch: e.branch_name,
      sha: (e.payload?.commit_sha as string) || null,
      filesCommitted: (e.payload?.files_committed as number) || 0,
      status: e.status,
      pr,
      prError,
    });
  }

  return commits;
}

function RecentCommitsPanel() {
  const [entries, setEntries] = useState<CommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<{ slug: string; id: string }[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const service = apiRegistry.getService(GitOpsLogApiService);
      const result = await service.list({ limit: 100 });
      setEntries(buildCommitEntries(result.entries ?? []));
    } catch {
      // silently ignore — this is supplementary info
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Subscribe to spaces so we can resolve slug → id for actions.
  // Also emit a load so the subscription fires even when spaces were
  // loaded before this component mounted.
  useEffect(() => {
    const sub = eventBus.on('wiki/spaces/loaded', ({ all }) => {
      setSpaces((all || []).map((s: { slug: string; id: string }) => ({ slug: s.slug, id: s.id })));
    });
    eventBus.emit('wiki/spaces/load');
    return () => { sub.unsubscribe(); };
  }, []);

  // Also refresh after a commit is made or branch unstaged
  useEffect(() => {
    const subs = [
      eventBus.on('wiki/draft/committed', () => void reload()),
      eventBus.on('wiki/branch/unstaged', () => void reload()),
      eventBus.on('wiki/branch/discarded', () => void reload()),
    ];
    return () => { subs.forEach((s) => s.unsubscribe()); };
  }, [reload]);

  const resolveSpaceId = useCallback(
    (entry: CommitEntry): string | null => {
      if (entry.spaceId) return entry.spaceId;
      const match = spaces.find((s) => s.slug === entry.spaceSlug);
      return match?.id ?? null;
    },
    [spaces],
  );

  if (loading && entries.length === 0) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
          <GitCommit size={14} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Recent Commits</h3>
        </div>
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          <Loader2 size={16} className="inline animate-spin mr-2" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border rounded-t-lg">
        <GitCommit size={14} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Recent Commits</h3>
        <span className="text-xs text-muted-foreground">{entries.length}</span>
        <button
          type="button"
          onClick={() => void reload()}
          className="ml-auto p-1 rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Reload"
        >
          <RotateCw size={12} />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          <GitCommit size={32} className="mx-auto mb-2 opacity-30" />
          <p>No commits yet. Commit some changes to see them here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((c, i) => (
            <CommitRow
              key={`${c.ts}-${i}`}
              entry={c}
              resolveSpaceId={resolveSpaceId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommitRow({
  entry: c,
  resolveSpaceId,
}: {
  entry: CommitEntry;
  resolveSpaceId: (entry: CommitEntry) => string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Listen for success/error events to clear busy state
  useEffect(() => {
    const subs = [
      eventBus.on('wiki/branch/unstaged', () => { setBusy(false); setActionError(null); }),
      eventBus.on('wiki/branch/discarded', () => { setBusy(false); setActionError(null); }),
      eventBus.on('wiki/pr/created', () => { setBusy(false); setActionError(null); }),
      eventBus.on('wiki/branch/error', ({ error }) => { setBusy(false); setActionError(error); }),
    ];
    return () => { subs.forEach((s) => s.unsubscribe()); };
  }, []);

  const hasPr = c.pr?.status === 'created' || c.pr?.status === 'existing';
  const canRevert = c.status === 'ok' && !hasPr;
  const canRetryPr = c.pr?.status === 'failed';
  const spaceId = resolveSpaceId(c);

  const handleRevert = () => {
    setMenuOpen(false);
    if (!spaceId) {
      setActionError(`Cannot resolve space ID for "${c.spaceSlug}"`);
      return;
    }
    setBusy(true);
    setActionError(null);
    unstageBranch(spaceId);
  };

  const handleRetryPr = () => {
    setMenuOpen(false);
    if (!spaceId) {
      setActionError(`Cannot resolve space ID for "${c.spaceSlug}"`);
      return;
    }
    setBusy(true);
    setActionError(null);
    createPullRequest({ spaceId });
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {c.status === 'ok' ? (
            <Check size={14} className="text-green-600" />
          ) : (
            <X size={14} className="text-destructive" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">
              {c.message || 'Commit'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{new Date(c.ts * 1000).toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <FileText size={10} />
              {c.spaceSlug}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch size={10} />
              {c.branch}
            </span>
            {c.sha && (
              <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-muted">
                {c.sha.slice(0, 7)}
              </code>
            )}
            {c.filesCommitted > 0 && (
              <span>{c.filesCommitted} file{c.filesCommitted === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <CommitPrBadge pr={c.pr} prError={c.prError} />
          {busy && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          {(canRevert || canRetryPr) && !busy && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1 rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                title="More actions"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1">
                  {canRevert && (
                    <button
                      type="button"
                      onClick={handleRevert}
                      disabled={!spaceId || busy}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-40"
                      title={!spaceId ? `Cannot resolve space "${c.spaceSlug}"` : 'Revert committed changes back to drafts'}
                    >
                      <Undo2 size={12} />
                      Revert commit
                    </button>
                  )}
                  {canRetryPr && (
                    <button
                      type="button"
                      onClick={handleRetryPr}
                      disabled={!spaceId || busy}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-40"
                      title={!spaceId ? `Cannot resolve space "${c.spaceSlug}"` : 'Retry pull request creation'}
                    >
                      <GitPullRequest size={12} />
                      Retry PR
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {actionError && (
        <div className="mt-1.5 ml-[26px] flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          <span className="break-words">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="flex-shrink-0 p-0.5 rounded hover:bg-destructive/20">
            <X size={10} />
          </button>
        </div>
      )}
    </li>
  );
}

function CommitPrBadge({ pr, prError }: { pr: CommitEntry['pr']; prError: string | null }) {
  if (!pr) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground" title="No PR">
        <GitPullRequest size={10} />
        No PR
      </span>
    );
  }

  if (pr.status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        title={prError || 'PR creation failed'}
      >
        <AlertCircle size={10} />
        PR failed
      </span>
    );
  }

  const label = pr.status === 'created' ? 'PR created' : 'PR exists';
  const classes = pr.status === 'created'
    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
    : 'bg-blue-500/10 text-blue-700 dark:text-blue-400';

  return pr.url ? (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${classes} hover:underline`}
      title={pr.url}
    >
      <GitPullRequest size={10} />
      {label}
      <ExternalLink size={8} />
    </a>
  ) : (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${classes}`}>
      <GitPullRequest size={10} />
      {label}
    </span>
  );
}

// =============================================================================
// CommitPrBanner — single banner with copy tailored to each pr_status outcome
// =============================================================================

interface CommitPrBannerProps {
  status: PRStatus;
  url: string | null;
  branch: string;
  error: string | null;
  retrying: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

function CommitPrBanner({ status, url, branch, error, retrying, onRetry, onDismiss }: CommitPrBannerProps) {
  // Banner color + copy is fully driven by status. Keeping the branching here
  // (rather than five almost-identical JSX blocks) makes future copy tweaks a
  // one-line change and avoids the silent-failure mode the old two-banner
  // shape had (`failed` with a stale `pr` prop showed the green banner).
  const palette =
    status === PRStatus.Created || status === PRStatus.Existing
      ? {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10',
          icon: <GitCommit size={16} className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />,
          link: 'text-blue-600 dark:text-blue-400',
          dismissBg: 'hover:bg-blue-500/20',
        }
      : status === PRStatus.Failed
        ? {
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-500/10',
            icon: <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />,
            link: 'text-yellow-700 dark:text-yellow-300',
            dismissBg: 'hover:bg-yellow-500/20',
          }
        : {
            border: 'border-muted-foreground/30',
            bg: 'bg-muted',
            icon: <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-muted-foreground" />,
            link: 'text-muted-foreground',
            dismissBg: 'hover:bg-accent',
          };

  const headline =
    status === PRStatus.Created
      ? `Pull request opened for ${branch}.`
      : status === PRStatus.Existing
        ? `New commit pushed to existing pull request for ${branch}.`
        : status === PRStatus.Failed
          ? 'Commit succeeded, but the PR could not be opened automatically.'
          : 'Commit succeeded. No PR was opened.';

  const subline =
    status === PRStatus.Failed
      ? error
      : status === PRStatus.NotAttempted
        ? 'Edit fork or git provider token is missing for this space — set them up to auto-open PRs on commit.'
        : null;

  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-md border ${palette.border} ${palette.bg} text-foreground text-sm`}
    >
      {palette.icon}
      <div className="flex-1 leading-relaxed">
        <p className="font-medium">{headline}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${palette.link} underline hover:no-underline break-all`}
          >
            {url}
          </a>
        )}
        {subline && (
          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
            {subline}
          </p>
        )}
        {status === PRStatus.Failed && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-500/20 disabled:opacity-50"
          >
            <GitCommit size={12} />
            {retrying ? 'Retrying…' : 'Retry PR'}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`flex-shrink-0 p-0.5 rounded ${palette.dismissBg} text-muted-foreground hover:text-foreground`}
        title="Dismiss"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default ChangesPage;
