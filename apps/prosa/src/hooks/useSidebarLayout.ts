import { useCallback, useEffect, useState } from "react";

const SIDEBAR_WIDTH_KEY = "prosa.sidebar.width";
const SC_HEIGHT_KEY = "prosa.sidebar.sourceControlHeight";

const DEFAULT_WIDTH_PX = 248;
const MIN_WIDTH_PX = 200;
const MAX_WIDTH_PX = 520;

const DEFAULT_SC_HEIGHT_PX = 260;
const MIN_SC_HEIGHT_PX = 96;
const MAX_SC_HEIGHT_PX = 560;

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

export function useSidebarLayout() {
  const [sidebarWidthPx, setSidebarWidthPx] = useState(() =>
    clamp(readNumber(SIDEBAR_WIDTH_KEY, DEFAULT_WIDTH_PX), MIN_WIDTH_PX, MAX_WIDTH_PX),
  );
  const [sourceControlHeightPx, setSourceControlHeightPx] = useState(() =>
    clamp(readNumber(SC_HEIGHT_KEY, DEFAULT_SC_HEIGHT_PX), MIN_SC_HEIGHT_PX, MAX_SC_HEIGHT_PX),
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--scribo-sidebar-width", `${sidebarWidthPx}px`);
  }, [sidebarWidthPx]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidthPx));
  }, [sidebarWidthPx]);

  useEffect(() => {
    window.localStorage.setItem(SC_HEIGHT_KEY, String(sourceControlHeightPx));
  }, [sourceControlHeightPx]);

  const adjustSidebarWidth = useCallback((deltaPx: number) => {
    setSidebarWidthPx((current) => clamp(current + deltaPx, MIN_WIDTH_PX, MAX_WIDTH_PX));
  }, []);

  const adjustSourceControlHeight = useCallback((deltaPx: number) => {
    setSourceControlHeightPx((current) =>
      clamp(current - deltaPx, MIN_SC_HEIGHT_PX, MAX_SC_HEIGHT_PX),
    );
  }, []);

  return {
    sidebarWidthPx,
    sourceControlHeightPx,
    adjustSidebarWidth,
    adjustSourceControlHeight,
  };
}
