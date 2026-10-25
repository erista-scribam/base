import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "prosa-markdown-wrap-size";

/** iA Writer line length limits (screen wrap only). */
export const IA_LINE_LENGTHS = [64, 72, 80] as const;
export type IaLineLength = (typeof IA_LINE_LENGTHS)[number];

export const IA_LINE_LENGTH_DEFAULT: IaLineLength = 72;

export function columnsForWrapMode(mode: MarkdownWrapMode): number | null {
  return mode.kind === "length" ? mode.columns : null;
}

export type MarkdownWrapMode = { kind: "length"; columns: IaLineLength } | { kind: "full" };

/** @deprecated alias for editor code */
export type MarkdownRulerMode = MarkdownWrapMode;

const LEGACY_SIZE: Record<string, IaLineLength> = {
  small: 64,
  medium: 72,
  large: 80,
  wide: 80,
};

function parseStoredLength(raw: string): IaLineLength | null {
  const n = Number(raw);
  if (IA_LINE_LENGTHS.includes(n as IaLineLength)) {
    return n as IaLineLength;
  }
  if (raw in LEGACY_SIZE) {
    return LEGACY_SIZE[raw]!;
  }
  return null;
}

function readStored(): MarkdownWrapMode {
  if (typeof window === "undefined") {
    return { kind: "length", columns: IA_LINE_LENGTH_DEFAULT };
  }
  const raw =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem("prosa-markdown-ruler-ch");
  if (raw === "full") {
    return { kind: "full" };
  }
  const columns = raw ? parseStoredLength(raw) : null;
  if (columns != null) {
    return { kind: "length", columns };
  }
  return { kind: "length", columns: IA_LINE_LENGTH_DEFAULT };
}

export function useMarkdownRuler() {
  const [mode, setMode] = useState<MarkdownWrapMode>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode.kind === "full" ? "full" : String(mode.columns));
  }, [mode]);

  const setLineLength = useCallback((columns: IaLineLength) => {
    setMode({ kind: "length", columns });
  }, []);

  const setFullWidth = useCallback(() => {
    setMode({ kind: "full" });
  }, []);

  return { rulerMode: mode, setLineLength, setRulerFullWidth: setFullWidth };
}
