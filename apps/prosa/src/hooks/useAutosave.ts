import { useEffect, useRef } from "react";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import {
  saveManuscriptDocument,
  saveRecoverySnapshot,
} from "../features/persistence/tauri-manuscripts";

const AUTOSAVE_MS = 3000;

export function useAutosave(
  manuscriptId: string | null,
  document: ProsaDocument | null,
  summary: ManuscriptSummary | null,
) {
  const documentRef = useRef(document);
  const summaryRef = useRef(summary);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  useEffect(() => {
    if (!manuscriptId || !document) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = documentRef.current;
      const currentSummary = summaryRef.current;
      if (!current) {
        return;
      }
      void saveRecoverySnapshot(manuscriptId, current, currentSummary).catch(console.error);
      void saveManuscriptDocument(manuscriptId, current, currentSummary).catch(console.error);
    }, AUTOSAVE_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [manuscriptId, document]);
}
