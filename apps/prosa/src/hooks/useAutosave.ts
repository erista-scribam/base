import { useEffect, useRef } from "react";
import type { ProsaDocument } from "@scribo/document-model";
import { saveManuscript, saveRecoverySnapshot } from "../features/persistence/tauri-manuscripts";

const AUTOSAVE_MS = 3000;

export function useAutosave(manuscriptId: string | null, document: ProsaDocument | null) {
  const documentRef = useRef(document);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    if (!manuscriptId || !document) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = documentRef.current;
      if (!current) {
        return;
      }
      void saveRecoverySnapshot(manuscriptId, current).catch(console.error);
      void saveManuscript(manuscriptId, current).catch(console.error);
    }, AUTOSAVE_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [manuscriptId, document]);
}
