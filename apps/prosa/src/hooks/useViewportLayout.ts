import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const internals = (window as unknown as { __TAURI_INTERNALS__?: { metadata?: unknown } })
    .__TAURI_INTERNALS__;
  return Boolean(internals?.metadata);
}

function syncViewportSize() {
  const height = window.innerHeight;
  const width = window.innerWidth;
  document.documentElement.style.setProperty("--scribo-app-height", `${height}px`);
  document.documentElement.style.setProperty("--scribo-app-width", `${width}px`);
}

export interface ViewportLayoutOptions {
  onWindowRestored?: () => void;
}

export function useViewportLayout(options?: ViewportLayoutOptions) {
  const onWindowRestoredRef = useRef(options?.onWindowRestored);

  useEffect(() => {
    onWindowRestoredRef.current = options?.onWindowRestored;
  }, [options?.onWindowRestored]);

  useEffect(() => {
    const scheduleSync = () => {
      syncViewportSize();
      requestAnimationFrame(syncViewportSize);
    };

    let wasFullscreen = false;
    let wasMaximized = false;

    const checkWindowMode = async () => {
      scheduleSync();
      if (!isTauriRuntime()) {
        return;
      }
      try {
        const win = getCurrentWindow();
        const [fullscreen, maximized] = await Promise.all([win.isFullscreen(), win.isMaximized()]);

        const leftFullscreen = wasFullscreen && !fullscreen;
        const leftMaximized = wasMaximized && !maximized;

        if (leftFullscreen || leftMaximized) {
          onWindowRestoredRef.current?.();
        }

        wasFullscreen = fullscreen;
        wasMaximized = maximized;
      } catch {
        // Browser-only dev — resize sync above is enough.
      }
    };

    void checkWindowMode();

    window.addEventListener("resize", checkWindowMode);
    document.addEventListener("fullscreenchange", checkWindowMode);
    window.visualViewport?.addEventListener("resize", checkWindowMode);

    let unlisten: (() => void) | undefined;
    if (isTauriRuntime()) {
      try {
        void getCurrentWindow()
          .onResized(() => {
            void checkWindowMode();
          })
          .then((dispose) => {
            unlisten = dispose;
          })
          .catch(() => undefined);
      } catch {
        // Tauri window API unavailable in plain browser dev.
      }
    }

    return () => {
      window.removeEventListener("resize", checkWindowMode);
      document.removeEventListener("fullscreenchange", checkWindowMode);
      window.visualViewport?.removeEventListener("resize", checkWindowMode);
      unlisten?.();
    };
  }, []);
}
