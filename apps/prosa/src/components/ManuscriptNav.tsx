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
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [createKind, setCreateKind] = useState<"file" | "folder" | null>(null);
  const [createName, setCreateName] = useState("");

  const manuscriptsById = useMemo(
    () => new Map(manuscripts.map((item) => [item.id, item])),
    [manuscripts],
  );

  const createParent = selectedFolderPath;

  const submitCreate = () => {
    const trimmed = createName.trim();
    if (!trimmed || !createKind) {
      return;
    }
    if (createKind === "file") {
      onCreateFile(createParent, trimmed);
    } else {
      onCreateFolder(createParent, trimmed);
    }
    setCreateKind(null);
    setCreateName("");
  };

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
                <>
                  <div className="sidebar-panel-toolbar">
                    <span className="sidebar-panel-title">Explorer</span>
                    <div className="app-sidebar-actions">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          setCreateKind("folder");
                          setCreateName("");
                        }}
                        title="New folder in selected location"
                      >
                        Folder
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          setCreateKind("file");
                          setCreateName("Untitled");
                        }}
                        title="New markdown file in selected location"
                      >
                        File
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={onOpenFile}
                        title="Import markdown"
                      >
                        Open
                      </button>
                    </div>
                  </div>

                  <div className="sidebar-panel-scroll sidebar-explorer-body">
                    {createKind ? (
                      <form
                        className="explorer-create-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          submitCreate();
                        }}
                      >
                        <input
                          type="text"
                          className="explorer-create-input"
                          value={createName}
                          placeholder={createKind === "file" ? "File name" : "Folder name"}
                          autoFocus
                          onChange={(event) => setCreateName(event.target.value)}
                        />
                        <button type="submit" className="sc-btn sc-btn-primary">
                          Create
                        </button>
                        <button
                          type="button"
                          className="sc-btn"
                          onClick={() => {
                            setCreateKind(null);
                            setCreateName("");
                          }}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : null}

                    <ProjectFilesExplorer
                      refreshKey={explorerRefreshKey}
                      activeId={activeId}
                      changedFiles={changedFiles}
                      selectedFolderPath={selectedFolderPath}
                      onSelectFolder={setSelectedFolderPath}
                      onSelectManuscript={onSelect}
                      onDelete={onDelete}
                      manuscriptsById={manuscriptsById}
                    />
                  </div>

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
