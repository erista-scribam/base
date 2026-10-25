import { useCallback, useState } from "react";

const STORAGE_KEY = "scribo-prosa-editor-zoom";

export const EDITOR_ZOOM_MIN = 0.85;
export const EDITOR_ZOOM_MAX = 1.35;
export const EDITOR_ZOOM_STEP = 0.05;
export const EDITOR_ZOOM_DEFAULT = 1;

function clampZoom(value: number): number {
  const stepped = Math.round(value / EDITOR_ZOOM_STEP) * EDITOR_ZOOM_STEP;
  return Math.min(EDITOR_ZOOM_MAX, Math.max(EDITOR_ZOOM_MIN, stepped));
}

function readStoredZoom(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return EDITOR_ZOOM_DEFAULT;
  }
  const parsed = Number.parseFloat(stored);
  if (Number.isNaN(parsed)) {
    return EDITOR_ZOOM_DEFAULT;
  }
  return clampZoom(parsed);
}

export function applyEditorZoom(level: number): number {
  const clamped = clampZoom(level);
  document.documentElement.style.setProperty("--scribo-editor-zoom", String(clamped));
  return clamped;
}

export function initEditorZoomFromStorage() {
  applyEditorZoom(readStoredZoom());
}

export function editorZoomLabel(level: number): string {
  return `${Math.round(level * 100)}%`;
}

export function useEditorZoom() {
  const [zoom, setZoom] = useState(() => {
    const initial = readStoredZoom();
    applyEditorZoom(initial);
    return initial;
  });

  const persist = useCallback((next: number) => {
    const clamped = applyEditorZoom(next);
    localStorage.setItem(STORAGE_KEY, String(clamped));
    setZoom(clamped);
  }, []);

  const zoomIn = useCallback(() => {
    persist(zoom + EDITOR_ZOOM_STEP);
  }, [persist, zoom]);

  const zoomOut = useCallback(() => {
    persist(zoom - EDITOR_ZOOM_STEP);
  }, [persist, zoom]);

  const resetZoom = useCallback(() => {
    persist(EDITOR_ZOOM_DEFAULT);
  }, [persist]);

  return { zoom, zoomIn, zoomOut, resetZoom, canZoomIn: zoom < EDITOR_ZOOM_MAX, canZoomOut: zoom > EDITOR_ZOOM_MIN };
}
