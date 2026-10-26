import { useEffect, useState } from "react";
import { stripBlockIdComments } from "../features/markdown/markdown-block-ids";
import { getChangedFilePreview } from "../features/version-control/project-version-control";
import { displayMarkdownRepoPath } from "../features/projects/manuscript-file-name";
import { SideBySideTextCompare } from "./SideBySideTextCompare";

export interface GitDiffEditorTabProps {
  relativePath: string;
  refreshKey: number;
  onOpenInEditor: () => void;
}

export function GitDiffEditorTab({
  relativePath,
  refreshKey,
  onOpenInEditor,
}: GitDiffEditorTabProps) {
  const [leftLabel, setLeftLabel] = useState("");
  const [rightLabel, setRightLabel] = useState("");
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<{ path: string; refreshKey: number } | null>(null);

  const loading = loadedFor?.path !== relativePath || loadedFor?.refreshKey !== refreshKey;

  useEffect(() => {
    let cancelled = false;
    void getChangedFilePreview(relativePath)
      .then((preview) => {
        if (cancelled) {
          return;
        }
        setError(null);
        setLeftLabel(preview.leftLabel);
        setRightLabel(preview.rightLabel);
        setLeftText(stripBlockIdComments(preview.leftText));
        setRightText(stripBlockIdComments(preview.rightText));
        setLoadedFor({ path: relativePath, refreshKey });
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load diff");
          setLeftText("");
          setRightText("");
          setLoadedFor({ path: relativePath, refreshKey });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [relativePath, refreshKey]);

  return (
    <div className="editor-diff-tab">
      <header className="editor-diff-tab-header">
        <span className="editor-diff-tab-path">{displayMarkdownRepoPath(relativePath)}</span>
        <button type="button" className="sc-btn sc-btn-primary" onClick={onOpenInEditor}>
          Open file
        </button>
      </header>
      <div className="editor-diff-tab-body">
        {loading ? (
          <p className="editor-diff-tab-placeholder">Loading diff…</p>
        ) : error ? (
          <p className="editor-diff-tab-placeholder">{error}</p>
        ) : (
          <SideBySideTextCompare
            className="editor-diff-compare"
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            leftText={leftText}
            rightText={rightText}
          />
        )}
      </div>
    </div>
  );
}
