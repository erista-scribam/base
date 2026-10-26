import type { ManuscriptSummary } from "@scribo/core";
import type { GitChangedFile } from "../features/version-control/project-version-control";
import { gitStatusForManuscriptPath } from "../features/version-control/git-file-status";
import type { LibraryViewMode } from "../hooks/useLibraryViewMode";
import type { SidebarProjectView } from "../hooks/useSidebarProjectView";
import { useSidebarLayout } from "../hooks/useSidebarLayout";
import { isTauriRuntime } from "../features/persistence/is-tauri";
import { GitFileStatusBadge } from "./GitFileStatusBadge";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { SidebarActivityBar } from "./SidebarActivityBar";
import { SidebarResizeSash } from "./SidebarResizeSash";
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
  sidebarProjectView: SidebarProjectView;
  onSidebarProjectViewChange: (view: SidebarProjectView) => void;
  changedFiles: GitChangedFile[];
  changeCount: number;
  mergeInProgress: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenFile: () => void;
  onChooseLibrary: () => void;
  onCreateProject: () => void;
  onSwitchProject: (rootPath: string) => void;
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

export function ManuscriptNav({
  manuscripts,
  activeId,
  libraryPath,
  projectTitle,
  libraryViewMode,
  onLibraryViewModeChange,
  sidebarProjectView,
  onSidebarProjectViewChange,
  changedFiles,
  changeCount,
  mergeInProgress,
  onSelect,
  onCreate,
  onOpenFile,
  onChooseLibrary,
  onCreateProject,
  onSwitchProject,
  onRevealLibrary,
  onRevealActive,
  onDelete,
  versionControlRefreshKey,
  onVersionControlError,
  onBeforeGitOperation,
  onGitOperationComplete,
}: ManuscriptNavProps) {
  const { adjustSidebarWidth } = useSidebarLayout();
  const showActivityBar = isTauriRuntime() && Boolean(libraryPath);

  return (
    <aside className="app-sidebar" aria-label="Navigation">
      <SidebarResizeSash
        orientation="vertical"
        className="sidebar-width-sash"
        ariaLabel="Resize sidebar"
        onDelta={adjustSidebarWidth}
      />
      <section className="sidebar-workspace" aria-label="Workspace">
        <div className="sidebar-zone-header">
          <span className="sidebar-zone-label">Workspace</span>
          <span className="sidebar-zone-hint">Choose a project folder</span>
        </div>
        <ProjectSwitcher
          currentRootPath={libraryPath}
          projectTitle={projectTitle}
          onOpenProject={onChooseLibrary}
          onCreateProject={onCreateProject}
          onSwitchProject={onSwitchProject}
          onRevealProject={onRevealLibrary}
        />
      </section>

      {libraryPath ? (
        <section className="sidebar-project" aria-label="Project">
          <div className="sidebar-project-body">
            {showActivityBar ? (
              <SidebarActivityBar
                activeView={sidebarProjectView}
                changeCount={changeCount}
                mergeInProgress={mergeInProgress}
                onSelectView={onSidebarProjectViewChange}
              />
            ) : null}
            <div className="sidebar-view-panel">
              {sidebarProjectView === "sourceControl" && showActivityBar ? (
                <SourceControlPanel
                  refreshKey={versionControlRefreshKey}
                  onError={onVersionControlError}
                  onBeforeGitOperation={onBeforeGitOperation}
                  onGitOperationComplete={async (result) => {
                    await onGitOperationComplete(result.workspaceUpdated === true);
                  }}
                />
              ) : (
                <>
                  <div className="app-sidebar-header sidebar-project-header">
                    <span className="app-sidebar-label">Manuscripts</span>
                    <div className="app-sidebar-actions">
                      <div
                        className="library-view-switch"
                        role="group"
                        aria-label="Manuscript layout"
                      >
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
                        title="Open markdown file in this project"
                      >
                        Open
                      </button>
                      <button type="button" className="text-btn" onClick={onCreate}>
                        New
                      </button>
                    </div>
                  </div>

                  <ul className="app-sidebar-list" data-library-view={libraryViewMode}>
                    {manuscripts.length === 0 ? (
                      <li className="app-sidebar-empty">
                        Add `.md` files to your project or create a new manuscript.
                      </li>
                    ) : (
                      manuscripts.map((item) => {
                        const gitEntry = gitStatusForManuscriptPath(item.filePath, changedFiles);
                        return (
                          <li key={item.id} className="manuscript-row">
                            <button
                              type="button"
                              className="manuscript-item"
                              data-active={activeId === item.id ? "true" : undefined}
                              onClick={() => onSelect(item.id)}
                            >
                              <div className="manuscript-item-title-row">
                                <span className="manuscript-item-title">
                                  {item.title || "Untitled"}
                                </span>
                                {gitEntry ? <GitFileStatusBadge status={gitEntry.status} /> : null}
                              </div>
                              {libraryViewMode === "compact" ? (
                                <div className="manuscript-item-meta">
                                  {formatCompactMeta(item)}
                                </div>
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
                        );
                      })
                    )}
                  </ul>

                  {activeId ? (
                    <div className="app-sidebar-footer">
                      <button type="button" className="sidebar-footer-btn" onClick={onRevealActive}>
                        Reveal in Finder
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="sidebar-project-placeholder">
          <p>Open or create a project to browse manuscripts and source control.</p>
          <button type="button" className="sc-btn sc-btn-primary" onClick={onChooseLibrary}>
            Open project…
          </button>
        </div>
      )}
    </aside>
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
