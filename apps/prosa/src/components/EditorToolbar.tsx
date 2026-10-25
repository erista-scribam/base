export interface EditorToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  saveState: "idle" | "saving" | "saved" | "error";
}

export function EditorToolbar({ title, onTitleChange, saveState }: EditorToolbarProps) {
  const statusLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "";

  return (
    <header className="flex items-center gap-4 border-b border-[var(--scribo-ui-border)] bg-[var(--scribo-ui-surface)] px-6 py-3">
      <input
        type="text"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
        aria-label="Manuscript title"
      />
      <span className="text-xs text-[var(--scribo-ui-muted)]">{statusLabel}</span>
    </header>
  );
}
