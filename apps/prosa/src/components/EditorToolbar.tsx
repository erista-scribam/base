import type { Editor } from "@tiptap/core";
import type { ThemeMode } from "../hooks/useTheme";
import type { EditorViewMode } from "./EditorWorkspace";
import { editorZoomLabel } from "../hooks/useEditorZoom";
import { FormatToolbar, MarkdownFormatReferenceBar } from "./FormatToolbar";
import { IconButton } from "./IconButton";

export interface EditorToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  saveState: "idle" | "dirty" | "saving" | "saved" | "error";
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  editor: Editor | null;
  viewMode: EditorViewMode;
  onToggleViewMode: () => void;
  markdownPreviewVisible: boolean;
  onToggleMarkdownPreview: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  editorZoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
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

function IconPreviewPane() {
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
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M13 5v14" />
    </svg>
  );
}

function IconTheme() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function themeLabel(mode: ThemeMode): string {
  return mode === "dark" ? "Switch to light mode" : "Switch to dark mode";
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
  viewMode,
  onToggleViewMode,
  markdownPreviewVisible,
  onToggleMarkdownPreview,
  theme,
  onToggleTheme,
  editorZoom,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: EditorToolbarProps) {
  const isMarkdown = viewMode === "split";
  const statusLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "dirty"
          ? "Unsaved changes"
          : saveState === "error"
            ? "Save failed"
            : "";

  return (
    <div className="editor-chrome" data-mode={isMarkdown ? "markdown" : "classic"}>
      <header className="editor-header">
        <IconButton
          label={sidebarCollapsed || focusMode ? "Show sidebar" : "Hide sidebar"}
          active={!sidebarCollapsed && !focusMode}
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
        <div className="editor-mode-switch" role="group" aria-label="Editor mode">
          <button
            type="button"
            className="editor-mode-switch-btn"
            data-active={!isMarkdown ? "true" : undefined}
            onClick={() => isMarkdown && onToggleViewMode()}
          >
            Classic
          </button>
          <button
            type="button"
            className="editor-mode-switch-btn"
            data-active={isMarkdown ? "true" : undefined}
            onClick={() => !isMarkdown && onToggleViewMode()}
          >
            Markdown
          </button>
        </div>
        {isMarkdown ? (
          <IconButton
            label={markdownPreviewVisible ? "Hide preview pane" : "Show preview pane"}
            active={markdownPreviewVisible}
            onClick={onToggleMarkdownPreview}
          >
            <IconPreviewPane />
          </IconButton>
        ) : null}
        <div className="editor-zoom" role="group" aria-label="Editor zoom">
          <button
            type="button"
            className="editor-zoom-btn"
            aria-label="Zoom out"
            title="Zoom out (⌘−)"
            disabled={!canZoomOut}
            onClick={onZoomOut}
          >
            −
          </button>
          <button
            type="button"
            className="editor-zoom-level"
            aria-label={`Reset zoom (${editorZoomLabel(editorZoom)})`}
            title={`Reset zoom to 100% (⌘0) — ${editorZoomLabel(editorZoom)}`}
            onClick={onZoomReset}
          >
            {editorZoomLabel(editorZoom)}
          </button>
          <button
            type="button"
            className="editor-zoom-btn"
            aria-label="Zoom in"
            title="Zoom in (⌘+)"
            disabled={!canZoomIn}
            onClick={onZoomIn}
          >
            +
          </button>
        </div>
        <IconButton label={themeLabel(theme)} active={theme === "dark"} onClick={onToggleTheme}>
          <IconTheme />
        </IconButton>
        <IconButton
          label={focusMode ? "Exit focus mode" : "Focus mode"}
          active={focusMode}
          onClick={onToggleFocusMode}
        >
          <IconFocus />
        </IconButton>
      </header>
      {viewMode === "classic" ? (
        <FormatToolbar editor={editor} />
      ) : (
        <MarkdownFormatReferenceBar />
      )}
    </div>
  );
}
