import { useCallback, useEffect, useState } from "react";
import {
  checkoutProjectBranch,
  commitProjectCheckpoint,
  createProjectBranch,
  getProjectVersionControl,
  type ProjectVersionControl,
} from "../features/version-control/project-version-control";
import { isTauriRuntime } from "../features/persistence/is-tauri";

export interface VersionControlPanelProps {
  refreshKey: number;
  onError: (message: string) => void;
  onProjectChanged: () => void;
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

export function VersionControlPanel({
  refreshKey,
  onError,
  onProjectChanged,
}: VersionControlPanelProps) {
  const [status, setStatus] = useState<ProjectVersionControl | null>(null);
  const [checkpointMessage, setCheckpointMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
          onError(cause instanceof Error ? cause.message : "Could not load version history");
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
        const next = await action();
        setStatus(next);
        onProjectChanged();
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : "Version control action failed");
      } finally {
        setBusy(false);
      }
    },
    [onError, onProjectChanged],
  );

  if (!isTauriRuntime() || !status?.initialized) {
    return null;
  }

  const current = status.currentBranch ?? status.branches[0]?.name ?? "main";
  const branchOptions =
    status.branches.length > 0 ? status.branches : [{ name: current, isCurrent: true }];

  return (
    <section className="version-panel" aria-label="Version control">
      <div className="version-panel-header">
        <span className="version-panel-label">Version</span>
        {status.dirty ? (
          <span className="version-panel-badge" title="Changes on disk not in last checkpoint">
            Uncheckpointed
          </span>
        ) : null}
      </div>

      <div className="version-panel-branch">
        <label className="version-panel-field-label" htmlFor="vc-branch-select">
          Branch
        </label>
        <div className="version-panel-branch-row">
          <select
            id="vc-branch-select"
            className="version-panel-select"
            value={current}
            disabled={busy}
            onChange={(event) => {
              const name = event.target.value;
              if (name === current) {
                return;
              }
              void run(() => checkoutProjectBranch(name));
            }}
          >
            {branchOptions.map((branch) => (
              <option key={branch.name} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="text-btn version-panel-new-branch"
            disabled={busy}
            onClick={() => {
              const name = window.prompt("New branch name");
              if (!name?.trim()) {
                return;
              }
              void run(() => createProjectBranch(name.trim()));
            }}
          >
            New
          </button>
        </div>
      </div>

      <div className="version-panel-checkpoint">
        <label className="version-panel-field-label" htmlFor="vc-checkpoint-message">
          Checkpoint
        </label>
        <input
          id="vc-checkpoint-message"
          className="version-panel-input"
          type="text"
          placeholder="What changed?"
          value={checkpointMessage}
          disabled={busy}
          onChange={(event) => setCheckpointMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void run(async () => {
                const next = await commitProjectCheckpoint(checkpointMessage);
                setCheckpointMessage("");
                return next;
              });
            }
          }}
        />
        <button
          type="button"
          className="sidebar-footer-btn version-panel-checkpoint-btn"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const next = await commitProjectCheckpoint(checkpointMessage);
              setCheckpointMessage("");
              return next;
            })
          }
        >
          Save checkpoint
        </button>
      </div>

      <ul className="version-panel-history">
        {status.recentCommits.length === 0 ? (
          <li className="version-panel-history-empty">No checkpoints yet.</li>
        ) : (
          status.recentCommits.map((commit) => (
            <li key={commit.id} className="version-panel-commit">
              <div className="version-panel-commit-message">{commit.message || "Checkpoint"}</div>
              <div className="version-panel-commit-meta">
                {formatCommitTime(commit.committedAt)}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
