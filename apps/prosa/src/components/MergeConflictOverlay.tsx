import { useCallback, useEffect, useState } from "react";
import {
  abortProjectMerge,
  completeProjectMerge,
  getMergeConflictPreview,
  getProjectVersionControl,
  resolveProjectMergeFile,
  type MergeConflictFilePreview,
  type MergeConflictResolution,
  type ProjectMergeStatus,
} from "../features/version-control/project-version-control";

export interface MergeConflictOverlayProps {
  refreshKey: number;
  onBeforeGitOperation: () => void | Promise<void>;
  onGitOperationComplete: (workspaceUpdated: boolean) => void | Promise<void>;
  onError: (message: string) => void;
  onOpenFile: (relativePath: string) => void;
}

export function MergeConflictOverlay({
  refreshKey,
  onBeforeGitOperation,
  onGitOperationComplete,
  onError,
  onOpenFile,
}: MergeConflictOverlayProps) {
  const [merge, setMerge] = useState<ProjectMergeStatus | null>(null);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<MergeConflictFilePreview | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getProjectVersionControl()
      .then((status) => {
        if (!cancelled) {
          setMerge(status.merge);
          setCurrentBranch(status.currentBranch ?? "main");
          if (status.merge.inProgress && status.merge.conflictedPaths.length > 0) {
            setSelectedPath((current) => current ?? status.merge.conflictedPaths[0] ?? null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMerge(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedPath || !merge?.inProgress) {
      return;
    }
    let cancelled = false;
    void getMergeConflictPreview(selectedPath)
      .then((next) => {
        if (!cancelled) {
          setPreview(next);
          setPreviewPath(selectedPath);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          onError(cause instanceof Error ? cause.message : "Could not load conflict preview");
          setPreview(null);
          setPreviewPath(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPath, merge?.inProgress, onError]);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      try {
        await onBeforeGitOperation();
        await action();
        const status = await getProjectVersionControl();
        setMerge(status.merge);
        if (status.merge.conflictedPaths.length > 0) {
          setSelectedPath(status.merge.conflictedPaths[0] ?? null);
        }
        await onGitOperationComplete(status.workspaceUpdated === true);
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : "Git operation failed");
      } finally {
        setBusy(false);
      }
    },
    [onBeforeGitOperation, onGitOperationComplete, onError],
  );

  if (!merge?.inProgress) {
    return null;
  }

  const source = merge.sourceBranch ?? "incoming branch";
  const pending = merge.conflictedPaths;
  const showOverlay = pending.length > 0;
  const region = previewPath === selectedPath && preview ? preview.regions[0] : undefined;

  return (
    <>
      <div className="merge-conflict-banner" role="status">
        <strong>Merge conflicts</strong>
        <span>
          {source} → {currentBranch}
          {pending.length > 0
            ? ` · ${pending.length} file${pending.length === 1 ? "" : "s"} need resolution`
            : " · ready to complete"}
        </span>
      </div>

      {showOverlay ? (
        <div
          className="merge-conflict-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Resolve merge conflicts"
        >
          <div className="merge-conflict-dialog">
            <header className="merge-conflict-header">
              <h2 className="merge-conflict-heading">Resolve merge conflicts</h2>
              <p className="merge-conflict-subheading">
                Compare versions, pick what to keep, or open the file in the editor.
              </p>
            </header>

            <div className="merge-conflict-body">
              <ul className="merge-conflict-files">
                {pending.map((path) => (
                  <li key={path}>
                    <button
                      type="button"
                      className="merge-conflict-file"
                      data-selected={path === selectedPath ? "true" : undefined}
                      onClick={() => setSelectedPath(path)}
                    >
                      {path}
                    </button>
                  </li>
                ))}
              </ul>

              {selectedPath && region ? (
                <div className="merge-conflict-compare">
                  <div className="merge-conflict-pane">
                    <h3>{currentBranch}</h3>
                    <pre>{region.ours || "(empty)"}</pre>
                  </div>
                  <div className="merge-conflict-pane merge-conflict-pane-incoming">
                    <h3>{source}</h3>
                    <pre>{region.theirs || "(empty)"}</pre>
                  </div>
                </div>
              ) : (
                <p className="merge-conflict-placeholder">
                  Select a file to preview conflicting text.
                </p>
              )}
            </div>

            <footer className="merge-conflict-footer">
              <button
                type="button"
                className="sc-btn"
                disabled={!selectedPath || busy}
                onClick={() => selectedPath && onOpenFile(selectedPath)}
              >
                Open in editor
              </button>
              <div className="merge-conflict-footer-actions">
                <button
                  type="button"
                  className="sc-btn"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await abortProjectMerge();
                    })
                  }
                >
                  Abort merge
                </button>
                <button
                  type="button"
                  className="sc-btn sc-btn-primary"
                  disabled={!selectedPath || busy}
                  onClick={() =>
                    selectedPath &&
                    void run(async () => {
                      await resolveProjectMergeFile(
                        selectedPath,
                        "ours" satisfies MergeConflictResolution,
                      );
                    })
                  }
                >
                  Use {currentBranch}
                </button>
                <button
                  type="button"
                  className="sc-btn sc-btn-primary"
                  disabled={!selectedPath || busy}
                  onClick={() =>
                    selectedPath &&
                    void run(async () => {
                      await resolveProjectMergeFile(selectedPath, "theirs");
                    })
                  }
                >
                  Use {source}
                </button>
                <button
                  type="button"
                  className="sc-btn"
                  disabled={!selectedPath || busy}
                  onClick={() =>
                    selectedPath &&
                    void run(async () => {
                      await resolveProjectMergeFile(selectedPath, "both");
                    })
                  }
                >
                  Keep both
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        <div className="merge-conflict-banner merge-conflict-banner-actions">
          <button
            type="button"
            className="sc-btn sc-btn-primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await completeProjectMerge();
              })
            }
          >
            Complete merge
          </button>
          <button
            type="button"
            className="sc-btn"
            disabled={busy}
            onClick={() => void run(() => abortProjectMerge().then(() => undefined))}
          >
            Abort merge
          </button>
        </div>
      )}
    </>
  );
}
