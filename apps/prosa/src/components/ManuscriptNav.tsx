import type { ManuscriptSummary } from "@scribo/core";
import type { LibraryViewMode } from "../hooks/useLibraryViewMode";
import { SourceControlPanel } from "./SourceControlPanel";
import {
  formatCompactMeta,
  formatManuscriptEdited,
  formatManuscriptPath,
  formatManuscriptTimestamp,
} from "../features/library/manuscript-list-meta";

export interface ManuscriptNavProps {
  manuscripts: ManuscriptSummary[];
  activeId: string | null;
  libraryPath: string | null;
  projectTitle: string | null;
  libraryViewMode: LibraryViewMode;
  onLibraryViewModeChange: (mode: LibraryViewMode) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenFile: () => void;
  onChooseLibrary: () => void;
  onRevealLibrary: () => void;
  onRevealActive: () => void;
  onDelete: (id: string) => void;
  versionControlRefreshKey: number;
  onVersionControlError: (message: string) => void;
  onBeforeGitOperation: () => void | Promise<void>;
  onGitOperationComplete: (workspaceUpdated: boolean) => void | Promise<void>;
}

const VIEW_LABELS: Record<LibraryViewMode, string> = {
  compact: "List",
  comfortable: "Details",
  grid: "Grid",
};

function formatLibraryLabel(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 2) {
    return path.replace(/^\/Users\/[^/]+/, "~");
  }
  return `~/${parts.slice(-2).join("/")}`;
}

export function ManuscriptNav({
  manuscripts,
  activeId,
  libraryPath,
  projectTitle,
  libraryViewMode,
  onLibraryViewModeChange,
  onSelect,
  onCreate,
  onOpenFile,
  onChooseLibrary,
  onRevealLibrary,
  onRevealActive,
  onDelete,
  versionControlRefreshKey,
  onVersionControlError,
  onBeforeGitOperation,
  onGitOperationComplete,
}: ManuscriptNavProps) {
  return (
    <aside className="app-sidebar" aria-label="Library">
      <div className="app-sidebar-header">
        <span className="app-sidebar-label">Library</span>
        <div className="app-sidebar-actions">
          <div className="library-view-switch" role="group" aria-label="Library layout">
            {(["compact", "comfortable", "grid"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className="library-view-btn"
                data-active={libraryViewMode === mode ? "true" : undefined}
                aria-pressed={libraryViewMode === mode}
                title={`${VIEW_LABELS[mode]} view`}
                onClick={() => onLibraryViewModeChange(mode)}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-btn"
            onClick={onOpenFile}
            title="Open markdown file"
          >
            Open
          </button>
          <button type="button" className="text-btn" onClick={onCreate}>
            New
          </button>
        </div>
      </div>

      {libraryPath ? (
        <div className="library-folder">
          {projectTitle ? (
            <span className="library-project-title" title={projectTitle}>
              {projectTitle}
            </span>
          ) : null}
          <button
            type="button"
            className="library-folder-path"
            onClick={onChooseLibrary}
            title={libraryPath}
          >
            {formatLibraryLabel(libraryPath)}
          </button>
          <button
            type="button"
            className="icon-btn library-folder-reveal"
            aria-label="Show library in Finder"
            title="Show in Finder"
            onClick={onRevealLibrary}
          >
            <IconReveal />
          </button>
        </div>
      ) : null}

      <SourceControlPanel
        refreshKey={versionControlRefreshKey}
        onError={onVersionControlError}
        onBeforeGitOperation={onBeforeGitOperation}
        onGitOperationComplete={async (result) => {
          await onGitOperationComplete(result.workspaceUpdated === true);
        }}
      />

      <ul className="app-sidebar-list" data-library-view={libraryViewMode}>
        {manuscripts.length === 0 ? (
          <li className="app-sidebar-empty">
            Add `.md` files to your library folder or create a new manuscript.
          </li>
        ) : (
          manuscripts.map((item) => (
            <li key={item.id} className="manuscript-row">
              <button
                type="button"
                className="manuscript-item"
                data-active={activeId === item.id ? "true" : undefined}
                onClick={() => onSelect(item.id)}
              >
                <div className="manuscript-item-title">{item.title || "Untitled"}</div>
                {libraryViewMode === "compact" ? (
                  <div className="manuscript-item-meta">{formatCompactMeta(item)}</div>
                ) : null}
                {libraryViewMode === "comfortable" ? (
                  <div className="manuscript-item-details">
                    <div className="manuscript-item-meta-line">
                      Edited {formatManuscriptTimestamp(item.updatedAt)}
                    </div>
                    {item.createdAt ? (
                      <div className="manuscript-item-meta-line">
                        Created {formatManuscriptTimestamp(item.createdAt)}
                      </div>
                    ) : null}
                    {formatManuscriptPath(item) ? (
                      <div className="manuscript-item-meta-line manuscript-item-path">
                        {formatManuscriptPath(item)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {libraryViewMode === "grid" ? (
                  <div className="manuscript-item-details">
                    <div className="manuscript-item-meta-line">
                      Edited {formatManuscriptEdited(item.updatedAt)}
                    </div>
                    {item.createdAt ? (
                      <div className="manuscript-item-meta-line">
                        Created {formatManuscriptEdited(item.createdAt)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </button>
              <button
                type="button"
                className="icon-btn manuscript-delete"
                aria-label={`Delete ${item.title || "Untitled"}`}
                title="Delete"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(item.id);
                }}
              >
                <IconTrash />
              </button>
            </li>
          ))
        )}
      </ul>

      {activeId ? (
        <div className="app-sidebar-footer">
          <button type="button" className="sidebar-footer-btn" onClick={onRevealActive}>
            Reveal in Finder
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function IconReveal() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M14 3h7v7M10 14L21 3M5 12v7h7" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
