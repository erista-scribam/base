import type { GitChangedFile } from "../features/version-control/project-version-control";
import { displayMarkdownFileName } from "../features/projects/manuscript-file-name";
import { splitRepoPath } from "../features/projects/project-tree";
import { GitFileStatusBadge } from "./GitFileStatusBadge";
import { gitFileStatusTitle } from "../features/version-control/git-file-status";

export interface ChangedFilesListProps {
  files: GitChangedFile[];
  activeDiffPath: string | null;
  onOpenDiff: (relativePath: string) => void;
  onOpenInEditor: (relativePath: string) => void;
}

export function ChangedFilesList({
  files,
  activeDiffPath,
  onOpenDiff,
  onOpenInEditor,
}: ChangedFilesListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className="changed-files" aria-label={`${files.length} changed files`}>
      <header className="changed-files-header">
        <span className="changed-files-title">Changes</span>
        <span className="changed-files-count">{files.length}</span>
      </header>
      <ul className="changed-files-list">
        {files.map((file) => {
          const { directory, fileName } = splitRepoPath(file.path);
          return (
            <li key={file.path}>
              <button
                type="button"
                className="changed-files-row"
                data-selected={activeDiffPath === file.path ? "true" : undefined}
                title={`${gitFileStatusTitle(file.status)}: ${file.path}`}
                onClick={() => onOpenDiff(file.path)}
                onDoubleClick={() => onOpenInEditor(file.path)}
              >
                <GitFileStatusBadge status={file.status} />
                <span className="changed-files-name">{displayMarkdownFileName(fileName)}</span>
                {directory ? <span className="changed-files-dir">{directory}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
