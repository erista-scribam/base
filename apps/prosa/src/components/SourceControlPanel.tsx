import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  checkoutProjectBranch,
  commitProjectCheckpoint,
  createProjectBranch,
  getProjectVersionControl,
  type GitBranchSummary,
  type ProjectVersionControl,
} from "../features/version-control/project-version-control";
import { isTauriRuntime } from "../features/persistence/is-tauri";

export interface SourceControlPanelProps {
  refreshKey: number;
  onError: (message: string) => void;
  onGitOperationComplete: (result: ProjectVersionControl) => void | Promise<void>;
  onBeforeGitOperation: () => void | Promise<void>;
}

function formatCommitTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BranchSwitcher({
  branches,
  currentBranch,
  disabled,
  onSwitch,
  onCreate,
}: {
  branches: GitBranchSummary[];
  currentBranch: string;
  disabled?: boolean;
  onSwitch: (name: string) => void;
  onCreate: (name: string) => void;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
        setFilter("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const needle = filter.trim().toLowerCase();
  const filtered = needle
    ? branches.filter((branch) => branch.name.toLowerCase().includes(needle))
    : branches;

  return (
    <div className="sc-branch-switcher" ref={rootRef}>
      <button
        type="button"
        className="sc-current-branch"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <IconBranch />
        <span className="sc-current-branch-name">{currentBranch}</span>
        <IconChevron />
      </button>
      {open ? (
        <div className="sc-branch-menu" id={menuId} role="listbox">
          <input
            className="sc-branch-filter"
            type="search"
            placeholder="Filter branches"
            value={filter}
            autoFocus
            onChange={(event) => setFilter(event.target.value)}
          />
          <ul className="sc-branch-list">
            {filtered.map((branch) => (
              <li key={branch.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={branch.name === currentBranch}
                  className="sc-branch-item"
                  onClick={() => {
                    setOpen(false);
                    setFilter("");
                    if (branch.name !== currentBranch) {
                      onSwitch(branch.name);
                    }
                  }}
                >
                  <span>{branch.name}</span>
                  {branch.name === currentBranch ? (
                    <span className="sc-branch-check">✓</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {creating ? (
            <div className="sc-branch-create">
              <input
                className="sc-branch-filter"
                type="text"
                placeholder="New branch name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && newName.trim()) {
                    event.preventDefault();
                    onCreate(newName.trim());
                    setNewName("");
                    setCreating(false);
                    setOpen(false);
                  }
                }}
              />
              <button
                type="button"
                className="sc-btn sc-btn-primary sc-btn-block"
                disabled={!newName.trim()}
                onClick={() => {
                  if (!newName.trim()) {
                    return;
                  }
                  onCreate(newName.trim());
                  setNewName("");
                  setCreating(false);
                  setOpen(false);
                }}
              >
                Create branch
              </button>
            </div>
          ) : (
            <button type="button" className="sc-branch-new" onClick={() => setCreating(true)}>
              + New branch…
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SourceControlPanel({
  refreshKey,
  onError,
  onGitOperationComplete,
  onBeforeGitOperation,
}: SourceControlPanelProps) {
  const [status, setStatus] = useState<ProjectVersionControl | null>(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"changes" | "history">("changes");

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    let cancelled = false;
    void getProjectVersionControl()
      .then((next) => {
        if (!cancelled) {
          setStatus(next);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          onError(cause instanceof Error ? cause.message : "Could not load repository");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, onError]);

  const run = useCallback(
    async (action: () => Promise<ProjectVersionControl>) => {
      setBusy(true);
      try {
        await onBeforeGitOperation();
        const next = await action();
        setStatus(next);
        await onGitOperationComplete(next);
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : "Git operation failed");
      } finally {
        setBusy(false);
      }
    },
    [onBeforeGitOperation, onGitOperationComplete, onError],
  );

  if (!isTauriRuntime() || !status?.initialized) {
    return null;
  }

  const current = status.currentBranch ?? status.branches[0]?.name ?? "main";
  const branches =
    status.branches.length > 0
      ? status.branches
      : [{ name: current, isCurrent: true } satisfies GitBranchSummary];

  return (
    <section className="source-control" aria-label="Source control">
      <BranchSwitcher
        branches={branches}
        currentBranch={current}
        disabled={busy}
        onSwitch={(name) => void run(() => checkoutProjectBranch(name))}
        onCreate={(name) => void run(() => createProjectBranch(name))}
      />

      <div className="sc-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="sc-tab"
          aria-selected={tab === "changes"}
          onClick={() => setTab("changes")}
        >
          Changes
        </button>
        <button
          type="button"
          role="tab"
          className="sc-tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      {tab === "changes" ? (
        <div className="sc-changes" role="tabpanel">
          {status.dirty ? (
            <p className="sc-changes-hint">
              You have saved changes that are not in the last checkpoint on{" "}
              <strong>{current}</strong>.
            </p>
          ) : (
            <p className="sc-changes-hint sc-changes-hint-muted">No uncheckpointed changes.</p>
          )}
          <label className="sc-label" htmlFor="sc-summary">
            Summary
          </label>
          <textarea
            id="sc-summary"
            className="sc-summary"
            rows={3}
            placeholder="Describe what you changed"
            value={summary}
            disabled={busy}
            onChange={(event) => setSummary(event.target.value)}
          />
          <button
            type="button"
            className="sc-btn sc-btn-primary sc-btn-block"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const next = await commitProjectCheckpoint(summary);
                setSummary("");
                return next;
              })
            }
          >
            Commit to {current}
          </button>
        </div>
      ) : (
        <ul className="sc-history" role="tabpanel">
          {status.recentCommits.length === 0 ? (
            <li className="sc-history-empty">No checkpoints yet on this branch.</li>
          ) : (
            status.recentCommits.map((commit) => (
              <li key={commit.id} className="sc-history-item">
                <div className="sc-history-summary">{commit.message || "Checkpoint"}</div>
                <div className="sc-history-meta">
                  <code>{commit.id.slice(0, 7)}</code>
                  <span>{formatCommitTime(commit.committedAt)}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}

function IconBranch() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 3v12M18 9a3 3 0 1 0-2.83-4M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
