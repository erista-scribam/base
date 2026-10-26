import type { ManuscriptSummary } from "@scribo/core";
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
  if (summary?.filePath) {
    return splitRepoPath(summary.filePath.replace(/\\/g, "/")).fileName;
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
        const showDirty = isActive && (saveState === "dirty" || saveState === "saving");

        return (
          <div
            key={id}
            className="editor-tab"
            role="tab"
            aria-selected={isActive}
            data-active={isActive ? "true" : undefined}
          >
            <button
              type="button"
              className="editor-tab-label"
              title={summary?.filePath ?? summary?.title ?? id}
              onClick={() => onSelectTab(id)}
            >
              {showDirty ? <span className="editor-tab-dirty" aria-hidden /> : null}
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
