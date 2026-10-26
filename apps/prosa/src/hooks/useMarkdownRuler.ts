import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "prosa-markdown-wrap-size";

/** Body column limits (after marker field); screen wrap only. */
export const MARKDOWN_LINE_LENGTH_PRESETS = [
  { id: "small", label: "Small", columns: 64 },
  { id: "medium", label: "Medium", columns: 72 },
  { id: "large", label: "Large", columns: 80 },
  { id: "very-large", label: "Very large", columns: 96 },
] as const;

export type MarkdownLineLengthPresetId = (typeof MARKDOWN_LINE_LENGTH_PRESETS)[number]["id"];

export type MarkdownLineLengthColumns = (typeof MARKDOWN_LINE_LENGTH_PRESETS)[number]["columns"];

/** @deprecated use preset ids */
export const IA_LINE_LENGTHS: readonly MarkdownLineLengthColumns[] =
  MARKDOWN_LINE_LENGTH_PRESETS.map((p) => p.columns);

export type IaLineLength = MarkdownLineLengthColumns;

export const IA_LINE_LENGTH_DEFAULT: IaLineLength = 72;

export function columnsForWrapMode(mode: MarkdownWrapMode): number | null {
  return mode.kind === "length" ? mode.columns : null;
}

export type MarkdownWrapMode =
  | { kind: "length"; presetId: MarkdownLineLengthPresetId; columns: MarkdownLineLengthColumns }
  | { kind: "full" };

/** @deprecated alias for editor code */
export type MarkdownRulerMode = MarkdownWrapMode;

const LEGACY_SIZE: Record<string, MarkdownLineLengthColumns> = {
  small: 64,
  medium: 72,
  large: 80,
  wide: 80,
  "very-large": 96,
};

function presetForColumns(columns: MarkdownLineLengthColumns): MarkdownLineLengthPresetId {
  const match = MARKDOWN_LINE_LENGTH_PRESETS.find((p) => p.columns === columns);
  return match?.id ?? "medium";
}

function parseStoredLength(raw: string): MarkdownLineLengthColumns | null {
  const n = Number(raw);
  if (MARKDOWN_LINE_LENGTH_PRESETS.some((p) => p.columns === n)) {
    return n as MarkdownLineLengthColumns;
  }
  if (raw in LEGACY_SIZE) {
    return LEGACY_SIZE[raw]!;
  }
  return null;
}

function readStored(): MarkdownWrapMode {
  if (typeof window === "undefined") {
    const columns = IA_LINE_LENGTH_DEFAULT;
    return { kind: "length", presetId: presetForColumns(columns), columns };
  }
  const raw =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem("prosa-markdown-ruler-ch");
  if (raw === "full") {
    return { kind: "full" };
  }
  if (raw && raw in LEGACY_SIZE && !/^\d+$/.test(raw)) {
    const columns = LEGACY_SIZE[raw]!;
    return { kind: "length", presetId: presetForColumns(columns), columns };
  }
  const columns = raw ? parseStoredLength(raw) : null;
  if (columns != null) {
    return { kind: "length", presetId: presetForColumns(columns), columns };
  }
  const defaultColumns = IA_LINE_LENGTH_DEFAULT;
  return {
    kind: "length",
    presetId: presetForColumns(defaultColumns),
    columns: defaultColumns,
  };
}

export function useMarkdownRuler() {
  const [mode, setMode] = useState<MarkdownWrapMode>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode.kind === "full" ? "full" : mode.presetId);
  }, [mode]);

  const setLineLengthPreset = useCallback((presetId: MarkdownLineLengthPresetId) => {
    const preset = MARKDOWN_LINE_LENGTH_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      return;
    }
    setMode({ kind: "length", presetId: preset.id, columns: preset.columns });
  }, []);

  /** @deprecated prefer setLineLengthPreset */
  const setLineLength = useCallback((columns: IaLineLength) => {
    setMode({
      kind: "length",
      presetId: presetForColumns(columns),
      columns,
    });
  }, []);

  const setFullWidth = useCallback(() => {
    setMode({ kind: "full" });
  }, []);

  return {
    rulerMode: mode,
    setLineLengthPreset,
    setLineLength,
    setRulerFullWidth: setFullWidth,
  };
}
