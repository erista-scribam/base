import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import { ManuscriptNav } from "../components/ManuscriptNav";
import { MergeConflictOverlay } from "../components/MergeConflictOverlay";
import { EditorTabBar } from "../components/EditorTabBar";
import { EditorToolbar } from "../components/EditorToolbar";
import { GitDiffEditorTab } from "../components/GitDiffEditorTab";
import { EmptyWorkspace } from "../components/EmptyWorkspace";
import {
  EditorWorkspace,
  type EditorViewMode,
  type EditorWorkspaceHandle,
} from "../components/EditorWorkspace";
import type { MarkdownFormatAction } from "../features/markdown/markdown-source-format";
import { useManuscriptPersistence } from "../hooks/useManuscriptPersistence";
import { useMarkdownPreviewVisible } from "../hooks/useMarkdownPreviewVisible";
import {
  diskRevisionIsNewer,
  manuscriptContentEqual,
} from "../features/persistence/document-revision";
import { resolveRecoveryOnOpen } from "../features/persistence/recovery-policy";
import { useAppShortcuts } from "../hooks/useAppShortcuts";
import { useEditorZoom } from "../hooks/useEditorZoom";
import { useTheme } from "../hooks/useTheme";
import { useViewportLayout } from "../hooks/useViewportLayout";
import { ask, open } from "@tauri-apps/plugin-dialog";
import {
  createManuscript,
  createProjectFolder,
  deleteManuscript,
  getLibrary,
  importMarkdownFile,
  initLibrary,
  isLegacyInternalManuscriptId,
  listManuscripts,
  migrateAllLegacyManuscriptsToLibrary,
  migrateLegacyRootManuscriptsToContent,
  migrateLegacyManuscriptToLibrary,
  loadManuscript,
  getManuscriptDiskRevision,
  loadRecoveryCandidate,
  revealLibraryFolder,
  revealManuscriptInFileManager,
} from "../features/persistence/tauri-manuscripts";
import { manuscriptIdForPath } from "../features/persistence/manuscript-path-id";
import { openProject } from "../features/projects/project-catalog";
import { GitBranchChip } from "../components/GitBranchChip";
import { useProjectGitStatus } from "../hooks/useProjectGitStatus";
import { useEditorTabs } from "../hooks/useEditorTabs";
import { useSidebarProjectView } from "../hooks/useSidebarProjectView";
import { isTauriRuntime } from "../features/persistence/is-tauri";
import { diffTabId, isDiffTabId, parseDiffTabId } from "../features/editor/editor-tab-ids";

export function App() {
  const [manuscripts, setManuscripts] = useState<ManuscriptSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [document, setDocument] = useState<ProsaDocument | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [externalChange, setExternalChange] = useState(false);
  const [diskRevisionAtOpen, setDiskRevisionAtOpen] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>("classic");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [layoutKey, setLayoutKey] = useState(0);
  const [libraryPath, setLibraryPath] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [versionControlRefreshKey, setVersionControlRefreshKey] = useState(0);
  const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { sidebarProjectView, setSidebarProjectView, showSourceControl } = useSidebarProjectView();
  const {
    initialized: gitInitialized,
    currentBranch,
    changedFiles,
    changeCount,
    mergeInProgress,
  } = useProjectGitStatus(versionControlRefreshKey, saveState);
  const { markdownPreviewVisible, toggleMarkdownPreview } = useMarkdownPreviewVisible();
  const { zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = useEditorZoom();
  const { openTabIds, registerTab, unregisterTab, replaceTabId, pickAdjacentTabId, setOpenTabIds } =
    useEditorTabs();

  const activeDiffPath = activeId ? parseDiffTabId(activeId) : null;
  const persistenceManuscriptId =
    activeId && !isDiffTabId(activeId) ? activeId : (document?.id ?? null);
  const activeSummary =
    persistenceManuscriptId != null
      ? (manuscripts.find((item) => item.id === persistenceManuscriptId) ?? null)
      : null;
  const manuscriptsById = useMemo(
    () => new Map(manuscripts.map((item) => [item.id, item])),
    [manuscripts],
  );
  const workspaceRef = useRef<EditorWorkspaceHandle>(null);
  const editorDocumentRef = useRef(document);
  const saveStateRef = useRef(saveState);
  const flushNowRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    editorDocumentRef.current = document;
  }, [document]);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  const openSourceControlSidebar = useCallback(() => {
    setSidebarCollapsed(false);
    setFocusMode(false);
    showSourceControl();
  }, [showSourceControl]);

  const restoreChromeAfterWindowChange = useCallback(() => {
    setLayoutKey((value) => value + 1);
    setFocusMode(false);
    setSidebarCollapsed(false);
  }, []);

  useViewportLayout({ onWindowRestored: restoreChromeAfterWindowChange });

  const refreshList = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    const items = await listManuscripts();
    setManuscripts(items);
    setExplorerRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    const onFocus = () => {
      void refreshList();
      const id = persistenceManuscriptId;
      const baseline = diskRevisionAtOpen;
      if (!id || !baseline || activeDiffPath) {
        return;
      }
      if (saveStateRef.current === "saving") {
        return;
      }
      void (async () => {
        try {
          const modifiedAt = await getManuscriptDiskRevision(id);
          if (!diskRevisionIsNewer(modifiedAt, baseline)) {
            return;
          }
          const editorDoc = editorDocumentRef.current;
          if (!editorDoc) {
            return;
          }
          if (saveStateRef.current === "dirty") {
            return;
          }
          const loaded = await loadManuscript(id);
          if (manuscriptContentEqual(editorDoc, loaded.document)) {
            setDiskRevisionAtOpen(modifiedAt);
            setExternalChange(false);
            return;
          }
          setExternalChange(true);
        } catch {
          // Ignore transient disk checks (e.g. file briefly locked).
        }
      })();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [activeDiffPath, diskRevisionAtOpen, persistenceManuscriptId, refreshList]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    let cancelled = false;
    void initLibrary()
      .then(async (library) => {
        if (cancelled) {
          return;
        }
        setLibraryPath(library.rootPath);
        setProjectTitle(library.project?.title ?? null);
        const migratedInternal = await migrateAllLegacyManuscriptsToLibrary().catch(() => 0);
        const migratedRoot = await migrateLegacyRootManuscriptsToContent().catch(() => 0);
        if (!cancelled && migratedInternal > 0) {
          setNotice(`Moved ${migratedInternal} manuscript(s) into your library folder.`);
        } else if (!cancelled && migratedRoot > 0) {
          setNotice(
            `Moved ${migratedRoot} manuscript(s) into content/manuscripts/ (project layout).`,
          );
        }
        const items = await listManuscripts();
        if (!cancelled) {
          setManuscripts(items);
          setVersionControlRefreshKey((value) => value + 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          void getLibrary()
            .then((library) => {
              setLibraryPath(library.rootPath);
              setProjectTitle(library.project?.title ?? null);
            })
            .catch(() => undefined);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load manuscripts");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setFocusMode(false);
    setSidebarCollapsed((value) => !value);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((value) => !value);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((mode) => {
      const next = mode === "classic" ? "split" : "classic";
      if (next === "split") {
        setEditor(null);
      }
      return next;
    });
  }, []);

  useAppShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleFocusMode: toggleFocusMode,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onZoomReset: resetZoom,
  });

  const openManuscript = useCallback(
    async (id: string, options?: { preferDisk?: boolean }) => {
      setError(null);
      if (!options?.preferDisk) {
        setNotice(null);
      }
      setExternalChange(false);
      try {
        if (activeId && activeId !== id && !isDiffTabId(activeId)) {
          await flushNowRef.current();
        }
        let resolvedId = id;
        if (isTauriRuntime() && isLegacyInternalManuscriptId(id)) {
          const migrated = await migrateLegacyManuscriptToLibrary(id);
          resolvedId = migrated.summary.id;
          await refreshList();
        }
        const loaded = await loadManuscript(resolvedId);
        let documentToOpen = loaded.document;
        if (!options?.preferDisk) {
          const recovery = await loadRecoveryCandidate(resolvedId);
          const decision = resolveRecoveryOnOpen(
            loaded.document,
            loaded.summary.updatedAt,
            recovery,
          );
          if (decision.kind === "use_recovery") {
            setNotice("Restored unsaved edits from recovery.");
          }
          documentToOpen = decision.document;
        }
        registerTab(resolvedId);
        setActiveId(resolvedId);
        setDocument(documentToOpen);
        setSaveState("idle");
        setSidebarCollapsed(false);
        if (isTauriRuntime()) {
          const diskRevision = await getManuscriptDiskRevision(resolvedId);
          setDiskRevisionAtOpen(diskRevision);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to open manuscript");
      }
    },
    [activeId, refreshList, registerTab],
  );

  const handleCreateFile = useCallback(
    async (parentRelative: string | null, title: string) => {
      if (!isTauriRuntime()) {
        return;
      }
      setError(null);
      const created = await createManuscript(title, parentRelative);
      await refreshList();
      registerTab(created.summary.id);
      setActiveId(created.summary.id);
      setDocument(created.document);
      setSaveState("idle");
      setSidebarCollapsed(false);
      setFocusMode(false);
      setViewMode("classic");
      setVersionControlRefreshKey((value) => value + 1);
    },
    [refreshList, registerTab],
  );

  const handleCreateFolder = useCallback(
    async (parentRelative: string | null, folderName: string) => {
      if (!isTauriRuntime()) {
        return;
      }
      setError(null);
      try {
        await createProjectFolder(folderName, parentRelative);
        await refreshList();
        setVersionControlRefreshKey((value) => value + 1);
        setNotice(`Created folder “${folderName}”.`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not create folder");
      }
    },
    [refreshList],
  );

  const handleCreate = useCallback(async () => {
    await handleCreateFile(null, "Untitled");
  }, [handleCreateFile]);

  const handleOpenRepoPath = useCallback(
    (relativePath: string) => {
      const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
      const match = manuscripts.find((item) => {
        const filePath = item.filePath?.replace(/\\/g, "/").replace(/^\.\//, "");
        if (!filePath) {
          return false;
        }
        return filePath === normalized || filePath.endsWith(`/${normalized}`);
      });
      const id = match?.id ?? manuscriptIdForPath(normalized);
      void openManuscript(id, { preferDisk: true }).catch(() => {
        setNotice(
          `Could not open ${relativePath}. Refresh the explorer or create the file on disk first.`,
        );
      });
    },
    [manuscripts, openManuscript],
  );

  const handleSaved = useCallback(
    async (saved: ManuscriptSummary, savedFromManuscriptId: string) => {
      await refreshList();
      setManuscripts((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      if (savedFromManuscriptId !== saved.id) {
        replaceTabId(savedFromManuscriptId, saved.id);
      }
      registerTab(saved.id);
      setActiveId((current) =>
        current === savedFromManuscriptId || current === saved.id ? saved.id : current,
      );
      if (isTauriRuntime()) {
        const diskRevision = await getManuscriptDiskRevision(saved.id);
        setDiskRevisionAtOpen(diskRevision);
        setExternalChange(false);
        setVersionControlRefreshKey((value) => value + 1);
      }
    },
    [refreshList, registerTab, replaceTabId],
  );

  const { notifyDocumentChange, setDocumentRef, flushNow } = useManuscriptPersistence(
    persistenceManuscriptId,
    activeSummary,
    setSaveState,
    (saved, savedFromManuscriptId) => void handleSaved(saved, savedFromManuscriptId),
    (message) => setError(message),
  );

  useEffect(() => {
    flushNowRef.current = flushNow;
  }, [flushNow]);

  const handleBeforeGitOperation = useCallback(async () => {
    await flushNow();
  }, [flushNow]);

  const openDiffTab = useCallback(
    (relativePath: string) => {
      void (async () => {
        const tabId = diffTabId(relativePath);
        if (activeId && activeId !== tabId && !isDiffTabId(activeId)) {
          await flushNow();
        }
        registerTab(tabId);
        setActiveId(tabId);
        setSidebarCollapsed(false);
        setFocusMode(false);
      })();
    },
    [activeId, flushNow, registerTab],
  );

  const switchEditorTab = useCallback(
    (id: string) => {
      if (id === activeId) {
        return;
      }
      if (isDiffTabId(id)) {
        void (async () => {
          if (activeId && !isDiffTabId(activeId)) {
            await flushNow();
          }
          setActiveId(id);
        })();
        return;
      }
      void openManuscript(id);
    },
    [activeId, flushNow, openManuscript],
  );

  const closeEditorTab = useCallback(
    (id: string) => {
      void (async () => {
        if (activeId === id && !isDiffTabId(id)) {
          await flushNow();
        }
        const nextId = pickAdjacentTabId(id);
        unregisterTab(id);
        if (activeId !== id) {
          return;
        }
        if (nextId) {
          if (isDiffTabId(nextId)) {
            setActiveId(nextId);
          } else {
            await openManuscript(nextId);
          }
        } else {
          setActiveId(null);
          setDocument(null);
          setSaveState("idle");
          setExternalChange(false);
        }
      })();
    },
    [activeId, flushNow, openManuscript, pickAdjacentTabId, unregisterTab],
  );

  const handleGitOperationComplete = useCallback(
    async (workspaceUpdated: boolean) => {
      await refreshList();
      setVersionControlRefreshKey((value) => value + 1);
      if (workspaceUpdated && activeId && !isDiffTabId(activeId)) {
        await openManuscript(activeId, { preferDisk: true });
        setNotice("Project files on disk changed — manuscript reloaded.");
      }
    },
    [activeId, openManuscript, refreshList],
  );

  const handleDocumentChange = useCallback(
    (next: ProsaDocument) => {
      setDocument(next);
      setDocumentRef(next);
      notifyDocumentChange(next);
    },
    [notifyDocumentChange, setDocumentRef],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!document) {
        return;
      }
      handleDocumentChange({ ...document, title });
    },
    [document, handleDocumentChange],
  );

  const handleEditorReady = useCallback((instance: Editor | null) => {
    setEditor(instance);
  }, []);

  const handleMarkdownFormat = useCallback((action: MarkdownFormatAction) => {
    workspaceRef.current?.applyMarkdownFormat(action);
  }, []);

  const applyProjectLibrary = useCallback(
    async (library: { rootPath: string; project?: { title: string } | null }) => {
      await flushNow();
      setOpenTabIds([]);
      setLibraryPath(library.rootPath);
      setProjectTitle(library.project?.title ?? null);
      setActiveId(null);
      setDocument(null);
      setSaveState("idle");
      setVersionControlRefreshKey((value) => value + 1);
      await refreshList();
    },
    [flushNow, refreshList, setOpenTabIds],
  );

  const handleChooseLibrary = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open project folder",
    });
    if (typeof selected !== "string") {
      return;
    }
    const library = await openProject(selected);
    await applyProjectLibrary(library);
  }, [applyProjectLibrary]);

  const handleSwitchProject = useCallback(
    async (rootPath: string) => {
      if (!isTauriRuntime()) {
        return;
      }
      const library = await openProject(rootPath);
      await applyProjectLibrary(library);
      setNotice("Project switched.");
    },
    [applyProjectLibrary],
  );

  const handleCreateProject = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    const root = await open({
      directory: true,
      multiple: false,
      title: "Choose or create project folder",
      canCreateDirectories: true,
    });
    if (typeof root !== "string") {
      return;
    }
    const library = await openProject(root);
    await applyProjectLibrary(library);
    setNotice(`Created project “${library.project?.title ?? "Untitled"}”.`);
  }, [applyProjectLibrary]);

  const handleOpenFile = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    const selected = await open({
      multiple: false,
      title: "Open markdown file",
      filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
    });
    if (typeof selected !== "string") {
      return;
    }
    setError(null);
    try {
      const loaded = await importMarkdownFile(selected);
      await refreshList();
      registerTab(loaded.summary.id);
      setActiveId(loaded.summary.id);
      setDocument(loaded.document);
      setSaveState("idle");
      setSidebarCollapsed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to open file");
    }
  }, [refreshList, registerTab]);

  const handleRevealLibrary = useCallback(() => {
    if (!isTauriRuntime()) {
      return;
    }
    void revealLibraryFolder().catch(console.error);
  }, []);

  const handleRevealActive = useCallback(
    (manuscriptId?: string) => {
      const targetId = manuscriptId ?? activeId;
      if (!targetId || !isTauriRuntime()) {
        return;
      }
      void (async () => {
        try {
          let id = targetId;
          if (isLegacyInternalManuscriptId(id)) {
            const migrated = await migrateLegacyManuscriptToLibrary(id);
            id = migrated.summary.id;
            setActiveId(id);
            setDocument(migrated.document);
            await refreshList();
          }
          await revealManuscriptInFileManager(id);
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Could not reveal file";
          if (message.includes("legacy_internal")) {
            setError(
              "This manuscript is still in app storage. It will move to the library on next launch.",
            );
            return;
          }
          setError(message);
        }
      })();
    },
    [activeId, refreshList],
  );

  useEffect(() => {
    setDocumentRef(document);
  }, [document, setDocumentRef]);

  const handleReloadExternal = useCallback(() => {
    if (!persistenceManuscriptId) {
      return;
    }
    void openManuscript(persistenceManuscriptId);
  }, [openManuscript, persistenceManuscriptId]);

  const handleDeleteManuscript = useCallback(
    (id: string) => {
      if (!isTauriRuntime()) {
        return;
      }
      const item = manuscripts.find((entry) => entry.id === id);
      const title = item?.title || "Untitled";
      void (async () => {
        const unsaved =
          id === activeId &&
          (saveStateRef.current === "dirty" || saveStateRef.current === "saving");
        const message = unsaved
          ? `"${title}" has unsaved changes. Delete anyway? The file will be removed permanently.`
          : `Delete "${title}" permanently? This cannot be undone.`;
        const confirmed = await ask(message, {
          title: "Delete manuscript",
          kind: "warning",
          okLabel: "Delete",
          cancelLabel: "Cancel",
        });
        if (!confirmed) {
          return;
        }
        setError(null);
        try {
          if (id === activeId) {
            await flushNow();
          }
          await deleteManuscript(id);
          const nextId = id === activeId ? pickAdjacentTabId(id) : null;
          unregisterTab(id);
          if (id === activeId) {
            if (nextId) {
              await openManuscript(nextId);
            } else {
              setActiveId(null);
              setDocument(null);
              setSaveState("idle");
              setExternalChange(false);
            }
          }
          await refreshList();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Failed to delete manuscript");
        }
      })();
    },
    [
      activeId,
      flushNow,
      manuscripts,
      openManuscript,
      pickAdjacentTabId,
      refreshList,
      unregisterTab,
    ],
  );

  return (
    <div
      className="app-shell"
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
      data-focus={focusMode ? "true" : "false"}
    >
      {error ? <div className="app-error">{error}</div> : null}
      {notice ? <div className="app-notice">{notice}</div> : null}
      {externalChange ? (
        <div className="app-notice app-notice-warn">
          This file changed on disk.{" "}
          <button type="button" className="text-btn" onClick={handleReloadExternal}>
            Reload from disk
          </button>
        </div>
      ) : null}
      {isTauriRuntime() ? (
        <MergeConflictOverlay
          refreshKey={versionControlRefreshKey}
          onBeforeGitOperation={handleBeforeGitOperation}
          onGitOperationComplete={handleGitOperationComplete}
          onError={(message) => setError(message)}
          onOpenFile={handleOpenRepoPath}
        />
      ) : null}
      {focusMode && gitInitialized && currentBranch ? (
        <div className="focus-mode-git-bar">
          <GitBranchChip
            branchName={currentBranch}
            changeCount={changeCount}
            mergeInProgress={mergeInProgress}
            compact
            onClick={openSourceControlSidebar}
          />
        </div>
      ) : null}
      <div className="app-body" key={layoutKey}>
        <ManuscriptNav
          manuscripts={manuscripts}
          activeId={persistenceManuscriptId}
          activeDiffPath={activeDiffPath}
          onOpenDiffTab={openDiffTab}
          libraryPath={libraryPath}
          projectTitle={projectTitle}
          sidebarProjectView={sidebarProjectView}
          onSidebarProjectViewChange={setSidebarProjectView}
          changedFiles={changedFiles}
          changeCount={changeCount}
          mergeInProgress={mergeInProgress}
          explorerRefreshKey={explorerRefreshKey}
          onSelect={(id) => void openManuscript(id)}
          onCreateFile={(parent, title) => void handleCreateFile(parent, title)}
          onCreateFolder={(parent, name) => void handleCreateFolder(parent, name)}
          onOpenRepoPath={handleOpenRepoPath}
          onChooseLibrary={() => void handleChooseLibrary()}
          onCreateProject={() => void handleCreateProject()}
          onSwitchProject={(path) => void handleSwitchProject(path)}
          onRevealLibrary={handleRevealLibrary}
          onRevealManuscript={(id) => handleRevealActive(id)}
          onImportMarkdown={() => void handleOpenFile()}
          onDelete={handleDeleteManuscript}
          versionControlRefreshKey={versionControlRefreshKey}
          onVersionControlError={(message) => setError(message)}
          onBeforeGitOperation={handleBeforeGitOperation}
          onGitOperationComplete={handleGitOperationComplete}
        />
        <main className="app-main" data-editor-view={viewMode === "split" ? "markdown" : "classic"}>
          {openTabIds.length > 0 || document || activeDiffPath ? (
            <>
              {openTabIds.length > 0 ? (
                <EditorTabBar
                  openTabIds={openTabIds}
                  activeId={activeId}
                  manuscriptsById={manuscriptsById}
                  saveState={saveState}
                  onSelectTab={switchEditorTab}
                  onCloseTab={closeEditorTab}
                />
              ) : null}
              {activeDiffPath ? (
                <GitDiffEditorTab
                  relativePath={activeDiffPath}
                  refreshKey={versionControlRefreshKey}
                  onOpenInEditor={() => handleOpenRepoPath(activeDiffPath)}
                />
              ) : document ? (
                <>
                  <EditorToolbar
                    title={document.title}
                    onTitleChange={handleTitleChange}
                    saveState={saveState}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                    focusMode={focusMode}
                    onToggleFocusMode={toggleFocusMode}
                    editor={editor}
                    viewMode={viewMode}
                    onToggleViewMode={toggleViewMode}
                    markdownPreviewVisible={markdownPreviewVisible}
                    onToggleMarkdownPreview={toggleMarkdownPreview}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    editorZoom={zoom}
                    canZoomIn={canZoomIn}
                    canZoomOut={canZoomOut}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onZoomReset={resetZoom}
                    onMarkdownFormat={viewMode === "split" ? handleMarkdownFormat : undefined}
                    gitBranch={gitInitialized ? currentBranch : null}
                    gitChangeCount={changeCount}
                    gitMergeInProgress={mergeInProgress}
                    onGitBranchClick={openSourceControlSidebar}
                  />
                  <div
                    className="editor-scroll"
                    data-view={viewMode === "split" ? "markdown" : "classic"}
                  >
                    <div
                      className="editor-scroll-inner"
                      data-view={viewMode === "split" ? "markdown" : "classic"}
                    >
                      <EditorWorkspace
                        ref={workspaceRef}
                        key={document.id}
                        document={document}
                        viewMode={viewMode}
                        markdownPreviewVisible={markdownPreviewVisible}
                        onToggleMarkdownPreview={toggleMarkdownPreview}
                        onDocumentChange={handleDocumentChange}
                        onEditorReady={handleEditorReady}
                        editorZoom={zoom}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <EmptyWorkspace onCreate={() => void handleCreate()} />
          )}
        </main>
      </div>
    </div>
  );
}
