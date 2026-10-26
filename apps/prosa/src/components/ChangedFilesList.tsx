import { useEffect, useMemo, useState } from "react";
import { stripBlockIdComments } from "../features/markdown/markdown-block-ids";
import type { GitChangedFile } from "../features/version-control/project-version-control";
import { getChangedFilePreview } from "../features/version-control/project-version-control";
import { splitRepoPath } from "../features/projects/project-tree";
import { GitFileStatusBadge } from "./GitFileStatusBadge";
import { SideBySideTextCompare } from "./SideBySideTextCompare";
import { gitFileStatusTitle } from "../features/version-control/git-file-status";

export interface ChangedFilesListProps {
  files: GitChangedFile[];
  refreshKey: number;
  onOpenInEditor: (relativePath: string) => void;
}

export function ChangedFilesList({ files, refreshKey, onOpenInEditor }: ChangedFilesListProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [leftLabel, setLeftLabel] = useState("");
  const [rightLabel, setRightLabel] = useState("");
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [loadedPreview, setLoadedPreview] = useState<{
    path: string;
    refreshKey: number;
  } | null>(null);

  const activePath = useMemo(() => {
    if (!selectedPath || files.length === 0) {
      return null;
    }
    return files.some((file) => file.path === selectedPath) ? selectedPath : null;
  }, [files, selectedPath]);

  const previewLoading =
    Boolean(activePath) &&
    (loadedPreview?.path !== activePath || loadedPreview?.refreshKey !== refreshKey);

  useEffect(() => {
    if (!activePath) {
      return;
    }
    let cancelled = false;
    void getChangedFilePreview(activePath)
      .then((preview) => {
        if (cancelled) {
          return;
        }
        setPreviewError(null);
        setLeftLabel(preview.leftLabel);
        setRightLabel(preview.rightLabel);
        setLeftText(stripBlockIdComments(preview.leftText));
        setRightText(stripBlockIdComments(preview.rightText));
        setLoadedPreview({ path: activePath, refreshKey });
      })
      .catch((cause) => {
        if (!cancelled) {
          setPreviewError(cause instanceof Error ? cause.message : "Could not load diff");
          setLeftText("");
          setRightText("");
          setLoadedPreview({ path: activePath, refreshKey });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePath, refreshKey]);

  if (files.length === 0) {
    return null;
  }

  return (
    <section className="changed-files" aria-label={`${files.length} changed files`}>
      <header className="changed-files-header">
        <span className="changed-files-title">Changes</span>
        <span className="changed-files-count">{files.length}</span>
      </header>
      <ul className="changed-files-list changed-files-list-compact">
        {files.map((file) => {
          const { directory, fileName } = splitRepoPath(file.path);
          return (
            <li key={file.path}>
              <button
                type="button"
                className="changed-files-row"
                data-selected={activePath === file.path ? "true" : undefined}
                title={`${gitFileStatusTitle(file.status)}: ${file.path}`}
                onClick={() => {
                  setSelectedPath(file.path);
                  setLoadedPreview(null);
                }}
                onDoubleClick={() => onOpenInEditor(file.path)}
              >
                <GitFileStatusBadge status={file.status} />
                <span className="changed-files-name">{fileName}</span>
                {directory ? <span className="changed-files-dir">{directory}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="changed-files-diff">
        {previewLoading ? (
          <p className="changed-files-diff-placeholder">Loading diff…</p>
        ) : previewError ? (
          <p className="changed-files-diff-placeholder">{previewError}</p>
        ) : activePath ? (
          <>
            <SideBySideTextCompare
              className="sidebar-file-diff"
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              leftText={leftText}
              rightText={rightText}
            />
            <button
              type="button"
              className="sc-btn sc-btn-block changed-files-open-btn"
              onClick={() => onOpenInEditor(activePath)}
            >
              Open in editor
            </button>
          </>
        ) : (
          <p className="changed-files-diff-placeholder">
            Click a changed file to compare HEAD with your working copy.
          </p>
        )}
      </div>
    </section>
  );
}
