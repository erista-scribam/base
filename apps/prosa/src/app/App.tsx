import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import { ManuscriptNav } from "../components/ManuscriptNav";
import { EditorToolbar } from "../components/EditorToolbar";
import { EmptyWorkspace } from "../components/EmptyWorkspace";
import { EditorWorkspace, type EditorViewMode } from "../components/EditorWorkspace";
import { useAutosave } from "../hooks/useAutosave";
import { useAppShortcuts } from "../hooks/useAppShortcuts";
import { useTheme } from "../hooks/useTheme";
import { useViewportLayout } from "../hooks/useViewportLayout";
import { open } from "@tauri-apps/plugin-dialog";
import {
  createManuscript,
  getLibrary,
  importMarkdownFile,
  initLibrary,
  listManuscripts,
  loadManuscript,
  loadRecoverySnapshot,
  revealLibraryFolder,
  revealManuscriptInFileManager,
  saveManuscriptDocument,
  setLibraryRoot,
} from "../features/persistence/tauri-manuscripts";
import { isTauriRuntime } from "../features/persistence/is-tauri";

export function App() {
  const [manuscripts, setManuscripts] = useState<ManuscriptSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [document, setDocument] = useState<ProsaDocument | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>("classic");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [layoutKey, setLayoutKey] = useState(0);
  const [libraryPath, setLibraryPath] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const activeSummary = manuscripts.find((item) => item.id === activeId) ?? null;

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
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshList]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    let cancelled = false;
    void initLibrary()
      .then((library) => {
        if (!cancelled) {
          setLibraryPath(library.rootPath);
        }
      })
      .catch(() => {
        if (!cancelled) {
          void getLibrary()
            .then((library) => setLibraryPath(library.rootPath))
            .catch(() => undefined);
        }
      });
    void listManuscripts()
      .then((items) => {
        if (!cancelled) {
          setManuscripts(items);
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

  useAppShortcuts({ onToggleSidebar: toggleSidebar, onToggleFocusMode: toggleFocusMode });

  const openManuscript = useCallback(async (id: string) => {
    setError(null);
    try {
      const loaded = await loadManuscript(id);
      let resolved = loaded.document;
      try {
        const recovery = await loadRecoverySnapshot(id);
        if (recovery) {
          resolved = recovery;
        }
      } catch {
        // Recovery snapshot can be corrupt; fall back to last saved document.
      }
      setActiveId(id);
      setDocument(resolved);
      setSaveState("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to open manuscript");
    }
  }, []);

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

  const handleDocumentChange = useCallback(
    (next: ProsaDocument) => {
      setDocument(next);
      if (!activeId) {
        return;
      }
      setSaveState("saving");
      const summary = manuscripts.find((item) => item.id === activeId) ?? null;
      void saveManuscriptDocument(activeId, next, summary)
        .then(async (saved) => {
          setSaveState("saved");
          await refreshList();
          setManuscripts((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        })
        .catch(() => setSaveState("error"));
    },
    [activeId, manuscripts, refreshList],
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
    void revealManuscriptInFileManager(activeId).catch(console.error);
  }, [activeId]);

  useAutosave(activeId, document, activeSummary);

  return (
    <div
      className="app-shell"
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
      data-focus={focusMode ? "true" : "false"}
    >
      {error ? <div className="app-error">{error}</div> : null}
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
        <main className="app-main">
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
                theme={theme}
                onToggleTheme={toggleTheme}
              />
              <div className="editor-scroll" data-view={viewMode}>
                <div className="editor-scroll-inner" data-view={viewMode}>
                  <EditorWorkspace
                    key={document.id}
                    document={document}
                    viewMode={viewMode}
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
