import type { ManuscriptSummary } from "@scribo/core";

export interface ManuscriptNavProps {
  manuscripts: ManuscriptSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function ManuscriptNav({ manuscripts, activeId, onSelect, onCreate }: ManuscriptNavProps) {
  return (
    <aside className="app-sidebar" aria-label="Manuscripts">
      <div className="app-sidebar-header">
        <span className="app-sidebar-label">Manuscripts</span>
        <button type="button" className="text-btn" onClick={onCreate}>
          New
        </button>
      </div>
      <ul className="app-sidebar-list">
        {manuscripts.length === 0 ? (
          <li className="app-sidebar-empty">No manuscripts yet. Create one to begin.</li>
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
                <div className="manuscript-item-meta">
                  {new Date(item.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
