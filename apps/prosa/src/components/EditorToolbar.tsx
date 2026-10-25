import type { Editor } from "@tiptap/core";
import { FormatToolbar } from "./FormatToolbar";
import { IconButton } from "./IconButton";

export interface EditorToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  saveState: "idle" | "saving" | "saved" | "error";
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  editor: Editor | null;
}

function IconSidebar() {
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
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M9 4v16" />
    </svg>
  );
}

function IconFocus() {
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
      <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </svg>
  );
}

export function EditorToolbar({
  title,
  onTitleChange,
  saveState,
  sidebarCollapsed,
  onToggleSidebar,
  focusMode,
  onToggleFocusMode,
  editor,
}: EditorToolbarProps) {
  const statusLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "";

  return (
    <div className="editor-chrome">
      <header className="editor-header">
        <IconButton
          label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          active={!sidebarCollapsed}
          onClick={onToggleSidebar}
        >
          <IconSidebar />
        </IconButton>
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="editor-title"
          placeholder="Untitled"
          aria-label="Manuscript title"
        />
        <span
          className="editor-save-status"
          data-state={saveState === "error" ? "error" : undefined}
          aria-live="polite"
        >
          {statusLabel}
        </span>
        <IconButton
          label={focusMode ? "Exit focus mode" : "Focus mode"}
          active={focusMode}
          onClick={onToggleFocusMode}
        >
          <IconFocus />
        </IconButton>
      </header>
      <FormatToolbar editor={editor} />
    </div>
  );
}
