import { useCallback, useEffect, useRef } from "react";
import type { ManuscriptSummary } from "@scribam/core";
import type { ProsaDocument } from "@scribam/document-model";
import { ManuscriptPersistence } from "../features/persistence/manuscript-persistence";
import { isTauriRuntime } from "../features/persistence/is-tauri";

export function useManuscriptPersistence(
  manuscriptId: string | null,
  summary: ManuscriptSummary | null,
  onSaveState: (state: "idle" | "dirty" | "saving" | "saved" | "error") => void,
  onSaved: (summary: ManuscriptSummary, savedFromManuscriptId: string) => void,
  onError: (message: string) => void,
) {
  const documentRef = useRef<ProsaDocument | null>(null);
  const summaryRef = useRef(summary);
  const engineRef = useRef<ManuscriptPersistence | null>(null);
  const callbacksRef = useRef({ onSaveState, onSaved, onError });

  useEffect(() => {
    callbacksRef.current = { onSaveState, onSaved, onError };
  }, [onSaveState, onSaved, onError]);

  useEffect(() => {
    if (engineRef.current == null) {
      engineRef.current = new ManuscriptPersistence({
        onStateChange: (state) => callbacksRef.current.onSaveState(state),
        onSaved: (saved, savedFromManuscriptId) =>
          callbacksRef.current.onSaved(saved, savedFromManuscriptId),
        onError: (message) => callbacksRef.current.onError(message),
      });
    }
  }, []);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  useEffect(() => {
    engineRef.current?.resetBaseline();
  }, [manuscriptId]);

  const notifyDocumentChange = useCallback(
    (document: ProsaDocument) => {
      documentRef.current = document;
      if (!manuscriptId || !isTauriRuntime()) {
        return;
      }
      const engine = engineRef.current;
      if (!engine) {
        return;
      }
      engine.noteRevision();
      engine.schedulePersist(manuscriptId, document, summaryRef.current);
    },
    [manuscriptId],
  );

  const flushNow = useCallback(async () => {
    const engine = engineRef.current;
    const document = documentRef.current;
    if (!engine || !document || !manuscriptId || !isTauriRuntime()) {
      return;
    }
    await engine.flushPending();
  }, [manuscriptId]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushNow();
      }
    };
    const onPageHide = () => {
      void flushNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushNow]);

  return {
    notifyDocumentChange,
    flushNow,
    setDocumentRef: (doc: ProsaDocument | null) => {
      documentRef.current = doc;
    },
  };
}
