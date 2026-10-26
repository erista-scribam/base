import { useEffect, useState } from "react";
import {
  getProjectVersionControl,
  type ProjectVersionControl,
} from "../features/version-control/project-version-control";
import { isTauriRuntime } from "../features/persistence/is-tauri";

export function useProjectGitStatus(refreshKey: number, saveState: string) {
  const [status, setStatus] = useState<ProjectVersionControl | null>(null);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    let cancelled = false;
    void getProjectVersionControl()
      .then((next) => {
        if (!cancelled) {
          setStatus(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, saveState]);

  const initialized = status?.initialized === true;
  const currentBranch = status?.currentBranch ?? null;
  const changedFiles = status?.changedFiles ?? [];
  const changeCount = changedFiles.length;
  const mergeInProgress = status?.merge.inProgress === true;

  return {
    status,
    initialized,
    currentBranch,
    changedFiles,
    changeCount,
    mergeInProgress,
    dirty: status?.dirty === true,
  };
}
