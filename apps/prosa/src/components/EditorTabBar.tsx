import type { ManuscriptSummary } from "@scribo/core";
import { isDiffTabId, parseDiffTabId } from "../features/editor/editor-tab-ids";
import { displayMarkdownFileName } from "../features/projects/manuscript-file-name";
import { splitRepoPath } from "../features/projects/project-tree";

export interface EditorTabBarProps {
  openTabIds: string[];
  activeId: string | null;
  manuscriptsById: Map<string, ManuscriptSummary>;
  saveState: "idle" | "dirty" | "saving" | "saved" | "error";
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

function tabLabel(summary: ManuscriptSummary | undefined, id: string): string {
  const diffPath = parseDiffTabId(id);
  if (diffPath) {
    return displayMarkdownFileName(splitRepoPath(diffPath).fileName);
  }
  if (summary?.filePath) {
    return displayMarkdownFileName(splitRepoPath(summary.filePath.replace(/\\/g, "/")).fileName);
  }
  return summary?.title?.trim() || id.slice(0, 8);
}

export function EditorTabBar({
  openTabIds,
  activeId,
  manuscriptsById,
  saveState,
  onSelectTab,
  onCloseTab,
}: EditorTabBarProps) {
  if (openTabIds.length === 0) {
    return null;
  }

  return (
    <div className="editor-tab-bar" role="tablist" aria-label="Open manuscripts">
      {openTabIds.map((id) => {
        const summary = manuscriptsById.get(id);
        const label = tabLabel(summary, id);
        const isActive = id === activeId;
        const isDiff = isDiffTabId(id);
        const showDirty = isActive && !isDiff && (saveState === "dirty" || saveState === "saving");
        const diffPath = parseDiffTabId(id);
        const title = diffPath ?? summary?.filePath ?? summary?.title ?? id;

        return (
          <div
            key={id}
            className="editor-tab"
            role="tab"
            aria-selected={isActive}
            data-active={isActive ? "true" : undefined}
            data-kind={isDiff ? "diff" : "file"}
          >
            <button
              type="button"
              className="editor-tab-label"
              title={title}
              onClick={() => onSelectTab(id)}
            >
              {showDirty ? <span className="editor-tab-dirty" aria-hidden /> : null}
              {isDiff ? <span className="editor-tab-diff-badge">M</span> : null}
              <span className="editor-tab-name">{label}</span>
            </button>
            <button
              type="button"
              className="editor-tab-close"
              aria-label={`Close ${label}`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
