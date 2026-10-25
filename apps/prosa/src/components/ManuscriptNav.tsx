import type { ManuscriptSummary } from "@scribo/core";

export interface ManuscriptNavProps {
  manuscripts: ManuscriptSummary[];
  activeId: string | null;
  libraryPath: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenFile: () => void;
  onChooseLibrary: () => void;
  onRevealLibrary: () => void;
  onRevealActive: () => void;
}

function formatLibraryLabel(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 2) {
    return path.replace(/^\/Users\/[^/]+/, "~");
  }
  return `~/${parts.slice(-2).join("/")}`;
}

function formatFileMeta(item: ManuscriptSummary): string {
  const date = new Date(item.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (!item.filePath || item.source === "internal") {
    return `App storage · ${date}`;
  }
  const segments = item.filePath.split(/[/\\]/);
  if (segments.length <= 1) {
    return date;
  }
  const folder = segments.slice(0, -1).join("/");
  return `${folder} · ${date}`;
}

export function ManuscriptNav({
  manuscripts,
  activeId,
  libraryPath,
  onSelect,
  onCreate,
  onOpenFile,
  onChooseLibrary,
  onRevealLibrary,
  onRevealActive,
}: ManuscriptNavProps) {
  return (
    <aside className="app-sidebar" aria-label="Library">
      <div className="app-sidebar-header">
        <span className="app-sidebar-label">Library</span>
        <div className="app-sidebar-actions">
          <button
            type="button"
            className="text-btn"
            onClick={onOpenFile}
            title="Open markdown file"
          >
            Open
          </button>
          <button type="button" className="text-btn" onClick={onCreate}>
            New
          </button>
        </div>
      </div>

      {libraryPath ? (
        <div className="library-folder">
          <button
            type="button"
            className="library-folder-path"
            onClick={onChooseLibrary}
            title={libraryPath}
          >
            {formatLibraryLabel(libraryPath)}
          </button>
          <button
            type="button"
            className="icon-btn library-folder-reveal"
            aria-label="Show library in Finder"
            title="Show in Finder"
            onClick={onRevealLibrary}
          >
            <IconReveal />
          </button>
        </div>
      ) : null}

      <ul className="app-sidebar-list">
        {manuscripts.length === 0 ? (
          <li className="app-sidebar-empty">
            Add `.md` files to your library folder or create a new manuscript.
          </li>
        ) : (
          manuscripts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="manuscript-item"
                data-active={activeId === item.id ? "true" : undefined}
                onClick={() => onSelect(item.id)}
              >
                <div className="manuscript-item-title">{item.title || "Untitled"}</div>
                <div className="manuscript-item-meta">{formatFileMeta(item)}</div>
              </button>
            </li>
          ))
        )}
      </ul>

      {activeId ? (
        <div className="app-sidebar-footer">
          <button type="button" className="sidebar-footer-btn" onClick={onRevealActive}>
            Reveal in Finder
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function IconReveal() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M14 3h7v7M10 14L21 3M5 12v7h7" />
    </svg>
  );
}
