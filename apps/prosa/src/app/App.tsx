import { useCallback, useEffect, useState } from "react";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import { ManuscriptNav } from "../components/ManuscriptNav";
import { EditorToolbar } from "../components/EditorToolbar";
import { ProsaEditor } from "../editor/ProsaEditor";
import { useAutosave } from "../hooks/useAutosave";
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

  const openManuscript = useCallback(async (id: string) => {
    setError(null);
    const loaded = await loadManuscript(id);
    const recovery = await loadRecoverySnapshot(id);
    setActiveId(id);
    setDocument(recovery ?? loaded.document);
  }, []);

  const handleCreate = useCallback(async () => {
    setError(null);
    const created = await createManuscript("Untitled");
    await refreshList();
    setActiveId(created.summary.id);
    setDocument(created.document);
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
          setManuscripts((prev) =>
            prev.map((item) => (item.id === summary.id ? summary : item)),
          );
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

  useAutosave(activeId, document);

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-[var(--scribo-ui-border)] px-4 py-2 text-sm font-semibold tracking-tight">
        Scribo Prosa
      </div>
      {error ? (
        <div className="bg-red-100 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <ManuscriptNav
          manuscripts={manuscripts}
          activeId={activeId}
          onSelect={(id) => void openManuscript(id)}
          onCreate={() => void handleCreate()}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          {document ? (
            <>
              <EditorToolbar
                title={document.title}
                onTitleChange={handleTitleChange}
                saveState={saveState}
              />
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <ProsaEditor document={document} onDocumentChange={handleDocumentChange} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[var(--scribo-ui-muted)]">
              Select or create a manuscript to start writing.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
