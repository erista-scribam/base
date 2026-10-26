import { useMemo, useState } from "react";
import type { ManuscriptSummary } from "@scribo/core";
import type { GitChangedFile } from "../features/version-control/project-version-control";
import type { SidebarProjectView } from "../hooks/useSidebarProjectView";
import { useSidebarLayout } from "../hooks/useSidebarLayout";
import { isTauriRuntime } from "../features/persistence/is-tauri";
import { ProjectFilesExplorer } from "./ProjectFilesExplorer";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { SidebarActivityBar } from "./SidebarActivityBar";
import { SidebarResizeSash } from "./SidebarResizeSash";
import { SourceControlPanel } from "./SourceControlPanel";

export interface ManuscriptNavProps {
  manuscripts: ManuscriptSummary[];
  activeId: string | null;
  libraryPath: string | null;
  projectTitle: string | null;
  sidebarProjectView: SidebarProjectView;
  onSidebarProjectViewChange: (view: SidebarProjectView) => void;
  changedFiles: GitChangedFile[];
  changeCount: number;
  mergeInProgress: boolean;
  explorerRefreshKey: number;
  onSelect: (id: string) => void;
  onCreateFile: (parentRelative: string | null, title: string) => void;
  onCreateFolder: (parentRelative: string | null, folderName: string) => void;
  onOpenRepoPath: (relativePath: string) => void;
  onChooseLibrary: () => void;
  onCreateProject: () => void;
  onSwitchProject: (rootPath: string) => void;
  onRevealLibrary: () => void;
  onRevealManuscript: (id: string) => void;
  onImportMarkdown: () => void;
  onDelete: (id: string) => void;
  versionControlRefreshKey: number;
  onVersionControlError: (message: string) => void;
  onBeforeGitOperation: () => void | Promise<void>;
  onGitOperationComplete: (workspaceUpdated: boolean) => void | Promise<void>;
}

export function ManuscriptNav({
  manuscripts,
  activeId,
  libraryPath,
  projectTitle,
  sidebarProjectView,
  onSidebarProjectViewChange,
  changedFiles,
  changeCount,
  mergeInProgress,
  explorerRefreshKey,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onOpenRepoPath,
  onChooseLibrary,
  onCreateProject,
  onSwitchProject,
  onRevealLibrary,
  onRevealManuscript,
  onImportMarkdown,
  onDelete,
  versionControlRefreshKey,
  onVersionControlError,
  onBeforeGitOperation,
  onGitOperationComplete,
}: ManuscriptNavProps) {
  const { adjustSidebarWidth, commitSidebarWidth } = useSidebarLayout();
  const showActivityBar = isTauriRuntime() && Boolean(libraryPath);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);

  const manuscriptsById = useMemo(
    () => new Map(manuscripts.map((item) => [item.id, item])),
    [manuscripts],
  );

  return (
    <aside className="app-sidebar" aria-label="Navigation">
      <SidebarResizeSash
        orientation="vertical"
        className="sidebar-width-sash"
        ariaLabel="Resize sidebar"
        onDelta={adjustSidebarWidth}
        onCommit={commitSidebarWidth}
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
          {showActivityBar ? (
            <SidebarActivityBar
              activeView={sidebarProjectView}
              changeCount={changeCount}
              mergeInProgress={mergeInProgress}
              onSelectView={onSidebarProjectViewChange}
            />
          ) : null}
          <div className="sidebar-project-body">
            <div className="sidebar-view-panel" data-sidebar-view={sidebarProjectView}>
              {sidebarProjectView === "sourceControl" && showActivityBar ? (
                <SourceControlPanel
                  refreshKey={versionControlRefreshKey}
                  onError={onVersionControlError}
                  onBeforeGitOperation={onBeforeGitOperation}
                  onGitOperationComplete={async (result) => {
                    await onGitOperationComplete(result.workspaceUpdated === true);
                  }}
                  onOpenChangedPath={onOpenRepoPath}
                />
              ) : (
                <div className="sidebar-panel-scroll sidebar-explorer-body">
                  <ProjectFilesExplorer
                    refreshKey={explorerRefreshKey}
                    activeId={activeId}
                    changedFiles={changedFiles}
                    selectedFolderPath={selectedFolderPath}
                    onSelectFolder={setSelectedFolderPath}
                    onSelectManuscript={onSelect}
                    onCreateFile={onCreateFile}
                    onCreateFolder={onCreateFolder}
                    onRevealManuscript={onRevealManuscript}
                    onImportMarkdown={onImportMarkdown}
                    onDelete={onDelete}
                    manuscriptsById={manuscriptsById}
                  />
                </div>
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
