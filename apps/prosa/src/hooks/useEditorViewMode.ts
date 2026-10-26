import { useCallback, useState } from "react";
import type { EditorViewMode } from "../components/EditorWorkspace";

const STORAGE_KEY = "prosa-editor-view-mode";

function normalizeStored(raw: string | null): EditorViewMode | null {
  if (raw === "proper" || raw === "minimalist") {
    return raw;
  }
  if (raw === "classic") {
    return "proper";
  }
  if (raw === "split") {
    return "minimalist";
  }
  return null;
}

function readStored(): EditorViewMode {
  try {
    return normalizeStored(window.localStorage.getItem(STORAGE_KEY)) ?? "proper";
  } catch {
    return "proper";
  }
}

export function useEditorViewMode() {
  const [viewMode, setViewModeState] = useState<EditorViewMode>(readStored);

  const setViewMode = useCallback(
    (value: EditorViewMode | ((prev: EditorViewMode) => EditorViewMode)) => {
      setViewModeState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Ignore.
        }
        return next;
      });
    },
    [],
  );

  return { viewMode, setViewMode };
}
