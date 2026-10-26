import type { GitChangedFile, GitFileChangeStatus } from "./project-version-control";

export function normalizeRepoPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function gitStatusForManuscriptPath(
  filePath: string | undefined | null,
  changedFiles: GitChangedFile[],
): GitChangedFile | null {
  if (!filePath) {
    return null;
  }
  const normalized = normalizeRepoPath(filePath);
  return (
    changedFiles.find((entry) => {
      const candidate = normalizeRepoPath(entry.path);
      return candidate === normalized || normalized.endsWith(`/${candidate}`);
    }) ?? null
  );
}

export function gitFileStatusLetter(status: GitFileChangeStatus): string {
  switch (status) {
    case "untracked":
      return "U";
    case "added":
      return "A";
    case "modified":
      return "M";
    case "deleted":
      return "D";
    case "renamed":
      return "R";
    case "conflicted":
      return "C";
    default:
      return "?";
  }
}

export function gitFileStatusTitle(status: GitFileChangeStatus): string {
  switch (status) {
    case "untracked":
      return "Untracked";
    case "added":
      return "Added";
    case "modified":
      return "Modified";
    case "deleted":
      return "Deleted";
    case "renamed":
      return "Renamed";
    case "conflicted":
      return "Conflict";
    default:
      return "Changed";
  }
}
