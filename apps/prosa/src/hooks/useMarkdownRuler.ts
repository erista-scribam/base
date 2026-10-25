import { useCallback, useEffect, useState } from "react";
import { MARKDOWN_BODY_COLUMN_CH } from "../features/markdown/codemirror-markdown-layout";

const STORAGE_KEY = "prosa-markdown-ruler-ch";

export const MARKDOWN_RULER_PRESETS = [64, 72, 80, 100] as const;
export type MarkdownRulerPreset = (typeof MARKDOWN_RULER_PRESETS)[number];

export type MarkdownRulerMode =
  | { kind: "columns"; columns: MarkdownRulerPreset }
  | { kind: "full" };

export function totalRulerCh(mode: MarkdownRulerMode): number | null {
  if (mode.kind === "full") {
    return null;
  }
  return MARKDOWN_BODY_COLUMN_CH + mode.columns;
}

function readStored(): MarkdownRulerMode {
  if (typeof window === "undefined") {
    return { kind: "columns", columns: 72 };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "full") {
    return { kind: "full" };
  }
  const parsed = Number(raw);
  if (MARKDOWN_RULER_PRESETS.includes(parsed as MarkdownRulerPreset)) {
    return { kind: "columns", columns: parsed as MarkdownRulerPreset };
  }
  return { kind: "columns", columns: 72 };
}

export function useMarkdownRuler() {
  const [mode, setMode] = useState<MarkdownRulerMode>(readStored);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      mode.kind === "full" ? "full" : String(mode.columns),
    );
  }, [mode]);

  const setColumns = useCallback((columns: MarkdownRulerPreset) => {
    setMode({ kind: "columns", columns });
  }, []);

  const setFullWidth = useCallback(() => {
    setMode({ kind: "full" });
  }, []);

  return { rulerMode: mode, setRulerColumns: setColumns, setRulerFullWidth: setFullWidth };
}
