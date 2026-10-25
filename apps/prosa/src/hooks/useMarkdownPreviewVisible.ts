import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "prosa-markdown-preview-visible";

function readStored(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

export function useMarkdownPreviewVisible() {
  const [visible, setVisible] = useState(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, visible ? "true" : "false");
  }, [visible]);

  const toggle = useCallback(() => {
    setVisible((value) => !value);
  }, []);

  return { markdownPreviewVisible: visible, toggleMarkdownPreview: toggle };
}
