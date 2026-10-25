import { useCallback, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "scribo-prosa-theme";

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  // Legacy "system" or missing: pick from OS once, then persist explicit choice on toggle.
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

export function initThemeFromStorage() {
  const mode = readStoredTheme();
  applyTheme(mode);
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const fromDom = document.documentElement.dataset.theme;
    if (fromDom === "light" || fromDom === "dark") {
      return fromDom;
    }
    return readStoredTheme();
  });

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: ThemeMode = current === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
