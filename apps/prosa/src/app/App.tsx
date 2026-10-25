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
import {
  createManuscript,
  listManuscripts,
  loadManuscript,
  loadRecoverySnapshot,
  saveManuscript,
} from "../features/persistence/tauri-manuscripts";

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
  const { theme, toggleTheme } = useTheme();

  const restoreChromeAfterWindowChange = useCallback(() => {
    setLayoutKey((value) => value + 1);
    setFocusMode(false);
    setSidebarCollapsed(false);
  }, []);

  useViewportLayout({ onWindowRestored: restoreChromeAfterWindowChange });

  const refreshList = useCallback(async () => {
    const items = await listManuscripts();
    setManuscripts(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
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
      void saveManuscript(activeId, next)
        .then(async (summary) => {
          setSaveState("saved");
          await refreshList();
          setManuscripts((prev) => prev.map((item) => (item.id === summary.id ? summary : item)));
        })
        .catch(() => setSaveState("error"));
    },
    [activeId, refreshList],
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

  useAutosave(activeId, document);

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
          onSelect={(id) => void openManuscript(id)}
          onCreate={() => void handleCreate()}
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
