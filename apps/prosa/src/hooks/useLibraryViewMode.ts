import { useCallback, useEffect, useState } from "react";

export type LibraryViewMode = "compact" | "comfortable" | "grid";

const STORAGE_KEY = "prosa-library-view";

function readStored(): LibraryViewMode {
  if (typeof window === "undefined") {
    return "compact";
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "comfortable" || value === "grid") {
    return value;
  }
  return "compact";
}

export function useLibraryViewMode() {
  const [viewMode, setViewMode] = useState<LibraryViewMode>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const cycleViewMode = useCallback(() => {
    setViewMode((current) => {
      if (current === "compact") {
        return "comfortable";
      }
      if (current === "comfortable") {
        return "grid";
      }
      return "compact";
    });
  }, []);

  return {
    libraryViewMode: viewMode,
    setLibraryViewMode: setViewMode,
    cycleLibraryViewMode: cycleViewMode,
  };
}
