import { useEffect } from "react";

export interface AppShortcutsOptions {
  onToggleSidebar: () => void;
  onToggleFocusMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function useAppShortcuts({
  onToggleSidebar,
  onToggleFocusMode,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: AppShortcutsOptions) {
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
        return;
      }

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        onZoomIn();
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        onZoomOut();
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        onZoomReset();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggleSidebar, onToggleFocusMode, onZoomIn, onZoomOut, onZoomReset]);
}
