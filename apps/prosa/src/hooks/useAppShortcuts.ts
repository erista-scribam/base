import { useEffect } from "react";

export interface AppShortcutsOptions {
  onToggleSidebar: () => void;
  onToggleFocusMode: () => void;
}

export function useAppShortcuts({ onToggleSidebar, onToggleFocusMode }: AppShortcutsOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) {
        return;
      }

      if (event.key === "\\") {
        event.preventDefault();
        onToggleSidebar();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        onToggleFocusMode();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggleSidebar, onToggleFocusMode]);
}
