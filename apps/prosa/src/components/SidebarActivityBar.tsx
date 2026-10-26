export type SidebarProjectView = "files" | "sourceControl";

export interface SidebarActivityBarProps {
  activeView: SidebarProjectView;
  changeCount: number;
  mergeInProgress: boolean;
  onSelectView: (view: SidebarProjectView) => void;
}

export function SidebarActivityBar({
  activeView,
  changeCount,
  mergeInProgress,
  onSelectView,
}: SidebarActivityBarProps) {
  const badge = changeCount > 0 ? (changeCount > 99 ? "99+" : String(changeCount)) : null;

  return (
    <nav className="sidebar-activity-bar" aria-label="Project views">
      <button
        type="button"
        className="sidebar-activity-btn"
        data-active={activeView === "files" ? "true" : undefined}
        aria-pressed={activeView === "files"}
        title="Explorer"
        aria-label="Explorer"
        onClick={() => onSelectView("files")}
      >
        <IconFiles />
      </button>
      <button
        type="button"
        className="sidebar-activity-btn"
        data-active={activeView === "sourceControl" ? "true" : undefined}
        aria-pressed={activeView === "sourceControl"}
        title="Source control"
        aria-label="Source control"
        onClick={() => onSelectView("sourceControl")}
      >
        <IconSourceControl />
        {badge ? (
          <span
            className="sidebar-activity-badge"
            data-merge={mergeInProgress ? "true" : undefined}
          >
            {badge}
          </span>
        ) : null}
      </button>
    </nav>
  );
}

function IconFiles() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function IconSourceControl() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
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
