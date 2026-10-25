import type { ManuscriptSummary } from "@scribo/core";

export interface ManuscriptNavProps {
  manuscripts: ManuscriptSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function ManuscriptNav({
  manuscripts,
  activeId,
  onSelect,
  onCreate,
}: ManuscriptNavProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--scribo-ui-border)] bg-[var(--scribo-ui-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--scribo-ui-border)] px-4 py-3">
        <span className="text-sm font-semibold tracking-wide">Manuscripts</span>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-md bg-[var(--scribo-ui-accent)] px-2 py-1 text-xs font-medium text-white"
        >
          New
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {manuscripts.length === 0 ? (
          <li className="px-2 py-3 text-sm text-[var(--scribo-ui-muted)]">
            No manuscripts yet. Create one to begin writing.
          </li>
        ) : (
          manuscripts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeId === item.id
                    ? "bg-[var(--scribo-ui-bg)] font-medium"
                    : "hover:bg-[var(--scribo-ui-bg)]/60"
                }`}
              >
                <div className="truncate">{item.title}</div>
                <div className="text-xs text-[var(--scribo-ui-muted)]">
                  {new Date(item.updatedAt).toLocaleString()}
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
