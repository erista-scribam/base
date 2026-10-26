import type { GitFileChangeStatus } from "../features/version-control/project-version-control";
import {
  gitFileStatusLetter,
  gitFileStatusTitle,
} from "../features/version-control/git-file-status";

export function GitFileStatusBadge({ status }: { status: GitFileChangeStatus }) {
  return (
    <span
      className="git-file-status"
      data-status={status}
      title={gitFileStatusTitle(status)}
      aria-label={gitFileStatusTitle(status)}
    >
      {gitFileStatusLetter(status)}
    </span>
  );
}
