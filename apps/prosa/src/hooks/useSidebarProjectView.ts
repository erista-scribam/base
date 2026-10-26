import { useCallback, useEffect, useState } from "react";

export type SidebarProjectView = "files" | "sourceControl";

const STORAGE_KEY = "prosa.sidebar.projectView";

function readStored(): SidebarProjectView {
  if (typeof window === "undefined") {
    return "files";
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "sourceControl" ? "sourceControl" : "files";
}

export function useSidebarProjectView() {
  const [view, setView] = useState<SidebarProjectView>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  const showSourceControl = useCallback(() => {
    setView("sourceControl");
  }, []);

  const showFiles = useCallback(() => {
    setView("files");
  }, []);

  return { sidebarProjectView: view, setSidebarProjectView: setView, showSourceControl, showFiles };
}
