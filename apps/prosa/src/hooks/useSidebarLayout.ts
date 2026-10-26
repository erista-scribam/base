import { useCallback, useEffect, useRef, useState } from "react";

const SIDEBAR_WIDTH_KEY = "prosa.sidebar.width";

const DEFAULT_WIDTH_PX = 248;
const MIN_WIDTH_PX = 200;
const MAX_WIDTH_PX = 520;

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applySidebarWidthCss(widthPx: number) {
  document.documentElement.style.setProperty("--scribo-sidebar-width", `${widthPx}px`);
}

export function useSidebarLayout() {
  const [sidebarWidthPx, setSidebarWidthPx] = useState(() =>
    clamp(readNumber(SIDEBAR_WIDTH_KEY, DEFAULT_WIDTH_PX), MIN_WIDTH_PX, MAX_WIDTH_PX),
  );
  const liveWidthRef = useRef(sidebarWidthPx);

  useEffect(() => {
    liveWidthRef.current = sidebarWidthPx;
    applySidebarWidthCss(sidebarWidthPx);
  }, [sidebarWidthPx]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidthPx));
  }, [sidebarWidthPx]);

  /** Updates layout via CSS only — avoids React re-renders while dragging. */
  const adjustSidebarWidth = useCallback((deltaPx: number) => {
    const next = clamp(liveWidthRef.current + deltaPx, MIN_WIDTH_PX, MAX_WIDTH_PX);
    liveWidthRef.current = next;
    applySidebarWidthCss(next);
  }, []);

  const commitSidebarWidth = useCallback(() => {
    setSidebarWidthPx(liveWidthRef.current);
  }, []);

  return {
    sidebarWidthPx,
    adjustSidebarWidth,
    commitSidebarWidth,
  };
}
