import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import { ManuscriptNav } from "../components/ManuscriptNav";
import { EditorToolbar } from "../components/EditorToolbar";
import { EmptyWorkspace } from "../components/EmptyWorkspace";
import { ProsaEditor } from "../editor/ProsaEditor";
import { useAutosave } from "../hooks/useAutosave";
import { useAppShortcuts } from "../hooks/useAppShortcuts";
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
  const [editor, setEditor] = useState<Editor | null>(null);

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
    setSidebarCollapsed((value) => !value);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((value) => {
      const next = !value;
      if (next) {
        setSidebarCollapsed(true);
      }
      return next;
    });
  }, []);

  useAppShortcuts({ onToggleSidebar: toggleSidebar, onToggleFocusMode: toggleFocusMode });

  const openManuscript = useCallback(async (id: string) => {
    setError(null);
    const loaded = await loadManuscript(id);
    const recovery = await loadRecoverySnapshot(id);
    setActiveId(id);
    setDocument(recovery ?? loaded.document);
    setSaveState("idle");
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
      <div className="titlebar-drag" data-tauri-drag-region aria-hidden />
      {error ? <div className="app-error">{error}</div> : null}
      <div className="app-body">
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
              />
              <div className="editor-scroll">
                <div className="editor-canvas-wrap">
                  <ProsaEditor
                    document={document}
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
