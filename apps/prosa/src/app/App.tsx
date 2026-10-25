import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import { ManuscriptNav } from "../components/ManuscriptNav";
import { EditorToolbar } from "../components/EditorToolbar";
import { EmptyWorkspace } from "../components/EmptyWorkspace";
import { EditorWorkspace, type EditorViewMode } from "../components/EditorWorkspace";
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
import { open } from "@tauri-apps/plugin-dialog";
import {
  createManuscript,
  getLibrary,
  importMarkdownFile,
  initLibrary,
  isLegacyInternalManuscriptId,
  listManuscripts,
  migrateAllLegacyManuscriptsToLibrary,
  migrateLegacyManuscriptToLibrary,
  loadManuscript,
  getManuscriptDiskRevision,
  loadRecoveryCandidate,
  revealLibraryFolder,
  revealManuscriptInFileManager,
  setLibraryRoot,
} from "../features/persistence/tauri-manuscripts";
import { isTauriRuntime } from "../features/persistence/is-tauri";

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
  const { theme, toggleTheme } = useTheme();
  const { markdownPreviewVisible, toggleMarkdownPreview } = useMarkdownPreviewVisible();
  const { zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = useEditorZoom();

  const activeSummary = manuscripts.find((item) => item.id === activeId) ?? null;
  const editorDocumentRef = useRef(document);
  const saveStateRef = useRef(saveState);

  useEffect(() => {
    editorDocumentRef.current = document;
  }, [document]);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

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
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    const onFocus = () => {
      void refreshList();
      const id = activeId;
      const baseline = diskRevisionAtOpen;
      if (!id || !baseline) {
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
  }, [activeId, diskRevisionAtOpen, refreshList]);

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
        const migrated = await migrateAllLegacyManuscriptsToLibrary().catch(() => 0);
        if (!cancelled && migrated > 0) {
          setNotice(`Moved ${migrated} manuscript(s) into your library folder.`);
        }
        const items = await listManuscripts();
        if (!cancelled) {
          setManuscripts(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          void getLibrary()
            .then((library) => setLibraryPath(library.rootPath))
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

  const openManuscript = useCallback(async (id: string) => {
    setError(null);
    setNotice(null);
    setExternalChange(false);
    try {
      let resolvedId = id;
      if (isTauriRuntime() && isLegacyInternalManuscriptId(id)) {
        const migrated = await migrateLegacyManuscriptToLibrary(id);
        resolvedId = migrated.summary.id;
        await refreshList();
      }
      const loaded = await loadManuscript(resolvedId);
      const recovery = await loadRecoveryCandidate(resolvedId);
      const decision = resolveRecoveryOnOpen(
        loaded.document,
        loaded.summary.updatedAt,
        recovery,
      );
      if (decision.kind === "use_recovery") {
        setNotice("Restored unsaved edits from recovery.");
      }
      setActiveId(resolvedId);
      setDocument(decision.document);
      setSaveState("idle");
      if (isTauriRuntime()) {
        const diskRevision = await getManuscriptDiskRevision(resolvedId);
        setDiskRevisionAtOpen(diskRevision);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to open manuscript");
    }
  }, [refreshList]);

  const handleCreate = useCallback(async () => {
    setError(null);
    const created = await createManuscript("Untitled");
    await refreshList();
    setActiveId(created.summary.id);
    setDocument(created.document);
    setSaveState("idle");
    setSidebarCollapsed(false);
    setFocusMode(false);
    setViewMode("classic");
  }, [refreshList]);

  const handleSaved = useCallback(
    async (saved: ManuscriptSummary) => {
      await refreshList();
      setManuscripts((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      if (isTauriRuntime() && activeId) {
        const diskRevision = await getManuscriptDiskRevision(activeId);
        setDiskRevisionAtOpen(diskRevision);
        setExternalChange(false);
      }
    },
    [activeId, refreshList],
  );

  const { notifyDocumentChange, setDocumentRef } = useManuscriptPersistence(
    activeId,
    activeSummary,
    setSaveState,
    (saved) => void handleSaved(saved),
    (message) => setError(message),
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

  const handleChooseLibrary = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose library folder",
    });
    if (typeof selected !== "string") {
      return;
    }
    const library = await setLibraryRoot(selected);
    setLibraryPath(library.rootPath);
    await refreshList();
  }, [refreshList]);

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
      setActiveId(loaded.summary.id);
      setDocument(loaded.document);
      setSaveState("idle");
      setSidebarCollapsed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to open file");
    }
  }, [refreshList]);

  const handleRevealLibrary = useCallback(() => {
    if (!isTauriRuntime()) {
      return;
    }
    void revealLibraryFolder().catch(console.error);
  }, []);

  const handleRevealActive = useCallback(() => {
    if (!activeId || !isTauriRuntime()) {
      return;
    }
    void (async () => {
      try {
        let id = activeId;
        if (isLegacyInternalManuscriptId(activeId)) {
          const migrated = await migrateLegacyManuscriptToLibrary(activeId);
          id = migrated.summary.id;
          setActiveId(id);
          setDocument(migrated.document);
          await refreshList();
        }
        await revealManuscriptInFileManager(id);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not reveal file";
        if (message.includes("legacy_internal")) {
          setError("This manuscript is still in app storage. It will move to the library on next launch.");
          return;
        }
        setError(message);
      }
    })();
  }, [activeId, refreshList]);

  useEffect(() => {
    setDocumentRef(document);
  }, [document, setDocumentRef]);

  const handleReloadExternal = useCallback(() => {
    if (!activeId) {
      return;
    }
    void openManuscript(activeId);
  }, [activeId, openManuscript]);

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
      <div className="app-body" key={layoutKey}>
        <ManuscriptNav
          manuscripts={manuscripts}
          activeId={activeId}
          libraryPath={libraryPath}
          onSelect={(id) => void openManuscript(id)}
          onCreate={() => void handleCreate()}
          onOpenFile={() => void handleOpenFile()}
          onChooseLibrary={() => void handleChooseLibrary()}
          onRevealLibrary={handleRevealLibrary}
          onRevealActive={handleRevealActive}
        />
        <main
          className="app-main"
          data-editor-view={viewMode === "split" ? "markdown" : "classic"}
        >
          {document ? (
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
                    key={document.id}
                    document={document}
                    viewMode={viewMode}
                    markdownPreviewVisible={markdownPreviewVisible}
                    onToggleMarkdownPreview={toggleMarkdownPreview}
                    onDocumentChange={handleDocumentChange}
                    onEditorReady={handleEditorReady}
                  />
                </div>
              </div>
            </>
          ) : (
            <EmptyWorkspace onCreate={() => void handleCreate()} />
          )}
        </main>
      </div>
    </div>
  );
}
