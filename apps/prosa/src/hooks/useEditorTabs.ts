import { useCallback, useEffect, useState } from "react";

const OPEN_TABS_KEY = "prosa.editor.openTabs";

function readStoredTabIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(OPEN_TABS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function useEditorTabs() {
  const [openTabIds, setOpenTabIds] = useState<string[]>(readStoredTabIds);

  useEffect(() => {
    window.localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(openTabIds));
  }, [openTabIds]);

  const registerTab = useCallback((id: string) => {
    setOpenTabIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const unregisterTab = useCallback((id: string) => {
    setOpenTabIds((current) => current.filter((item) => item !== id));
  }, []);

  const replaceTabId = useCallback((fromId: string, toId: string) => {
    setOpenTabIds((current) => {
      const mapped = current.map((item) => (item === fromId ? toId : item));
      return mapped.filter((item, index) => mapped.indexOf(item) === index);
    });
  }, []);

  const pickAdjacentTabId = useCallback(
    (closingId: string): string | null => {
      const index = openTabIds.indexOf(closingId);
      if (index === -1) {
        return openTabIds[0] ?? null;
      }
      if (openTabIds.length <= 1) {
        return null;
      }
      return openTabIds[index + 1] ?? openTabIds[index - 1] ?? null;
    },
    [openTabIds],
  );

  return {
    openTabIds,
    registerTab,
    unregisterTab,
    replaceTabId,
    pickAdjacentTabId,
    setOpenTabIds,
  };
}
