export interface GitBranchChipProps {
  branchName: string;
  changeCount?: number;
  mergeInProgress?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function GitBranchChip({
  branchName,
  changeCount = 0,
  mergeInProgress = false,
  compact = false,
  onClick,
}: GitBranchChipProps) {
  const Tag = onClick ? "button" : "span";
  const badge =
    changeCount > 0
      ? changeCount > 99
        ? "99+"
        : String(changeCount)
      : mergeInProgress
        ? "!"
        : null;

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`git-branch-chip${compact ? " git-branch-chip-compact" : ""}`}
      title={
        mergeInProgress
          ? `Merge in progress on ${branchName}`
          : changeCount > 0
            ? `${changeCount} changed file${changeCount === 1 ? "" : "s"} on ${branchName}`
            : `On branch ${branchName}`
      }
      onClick={onClick}
    >
      <IconBranch />
      <span className="git-branch-chip-name">{branchName}</span>
      {badge ? (
        <span className="git-branch-chip-badge" data-merge={mergeInProgress ? "true" : undefined}>
          {badge}
        </span>
      ) : null}
    </Tag>
  );
}

function IconBranch() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M6 8.5v3a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v3" />
      <path d="M18 8.5v3a4 4 0 0 1-4 4h-1" />
    </svg>
  );
}
