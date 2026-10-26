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
        <IconExplorer />
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

/** Explorer — folder + sheet (Codicons-inspired, single-color stroke). */
function IconExplorer() {
  return (
    <svg
      className="sidebar-activity-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 7.5V19a1.5 1.5 0 001.5 1.5H18A1.5 1.5 0 0019.5 19V9.5H11.5L9.5 7.5H4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 7.5V5.5A1.5 1.5 0 0111 4h7.5A1.5 1.5 0 0120 5.5V19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Source control — branch graph (simplified Git icon). */
function IconSourceControl() {
  return (
    <svg
      className="sidebar-activity-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="7" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 9.25v4.5a3 3 0 003 3h4a3 3 0 013 3v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 13.25V9.25a3 3 0 00-3-3H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
