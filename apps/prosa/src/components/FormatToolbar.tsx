import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { MarkdownFormatAction } from "../features/markdown/markdown-source-format";
import { IconButton } from "./IconButton";

export interface FormatToolbarProps {
  editor: Editor | null;
}

function IconBold() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5zm0 2v5h5.5a3.5 3.5 0 0 0 0-7H8z" />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 5h8v2h-3l-4 10h3v2H6v-2h3l4-10h-3V5z" />
    </svg>
  );
}

function IconUnderline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5v7a5 5 0 0 0 10 0V5h2v7a7 7 0 0 1-14 0V5h2zm-2 14h16v2H5v-2z" />
    </svg>
  );
}

function IconStrike() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h10v2H7V5zm10 12H7v-2h10v2zm-3-4H7c0-3.5 10-3 10-6 0-1.5-1.5-3-4-3S5 7.5 5 9H3c0-3 3-5 7-5s7 2 7 5c0 3.5-10 3-10 6h6v2z" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
    </svg>
  );
}

function IconBulletList() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm4-10h14v2H8V6zm0 5h14v2H8v-2zm0 5h14v2H8v-2z" />
    </svg>
  );
}

function IconNumberedList() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5h2v3H3V5zm0 7h2v3H3v-3zm0 7h2v3H3v-3zm4-12h14v2H7V7zm0 5h14v2H7v-2zm0 5h14v2H7v-2zM3 4.5V3h1v1.5H3zm0 7V10h1v1.5H3zm0 7V17h1v1.5H3z" />
    </svg>
  );
}

function IconTaskList() {
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
      <rect x="4" y="5" width="4" height="4" rx="0.5" />
      <path d="M9.5 7H20M4 13h4l1 2 3-4 2 3h6M4 19h4" />
    </svg>
  );
}

function IconQuote() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 7h4v4H9.5a2.5 2.5 0 0 0 0 5H7v-2h2.5a.5.5 0 0 0 0-1H7V7zm10 0h-4v4h1.5a2.5 2.5 0 0 1 0 5H17v-2h-2.5a.5.5 0 0 0 0-1H17V7z" />
    </svg>
  );
}

function IconSceneBreak() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 12h12v1.5H6V12zm0 4h12v1.5H6V16z" />
    </svg>
  );
}

function IconCodeBlock() {
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
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="M8 10l-2 2 2 2M16 10l2 2-2 2" />
    </svg>
  );
}

function FormatDivider() {
  return <span className="format-bar-divider" aria-hidden />;
}

function HeadingButton({
  level,
  editor,
  run,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  editor: Editor;
  run: (command: () => boolean) => void;
}) {
  return (
    <IconButton
      label={`Heading ${level}`}
      active={editor.isActive("heading", { level })}
      onClick={() => run(() => editor.chain().focus().toggleHeading({ level }).run())}
    >
      <span className="format-text-label">H{level}</span>
    </IconButton>
  );
}

export interface MarkdownFormatToolbarProps {
  onFormat: (action: MarkdownFormatAction) => void;
}

export function MarkdownFormatToolbar({ onFormat }: MarkdownFormatToolbarProps) {
  const run = (action: MarkdownFormatAction) => {
    onFormat(action);
  };

  return (
    <div className="format-bar" role="toolbar" aria-label="Markdown formatting">
      <div className="format-bar-group" aria-label="Character style">
        <IconButton label="Bold" onClick={() => run("bold")}>
          <IconBold />
        </IconButton>
        <IconButton label="Italic" onClick={() => run("italic")}>
          <IconItalic />
        </IconButton>
      </div>
      <FormatDivider />
      <div className="format-bar-group" aria-label="Headings">
        <IconButton label="Heading 1" onClick={() => run("heading1")}>
          <span className="format-text-label">H1</span>
        </IconButton>
        <IconButton label="Heading 2" onClick={() => run("heading2")}>
          <span className="format-text-label">H2</span>
        </IconButton>
        <IconButton label="Heading 3" onClick={() => run("heading3")}>
          <span className="format-text-label">H3</span>
        </IconButton>
        <IconButton label="Body paragraph" onClick={() => run("paragraph")}>
          <span className="format-text-label-muted">¶</span>
        </IconButton>
      </div>
      <FormatDivider />
      <div className="format-bar-group" aria-label="Blocks">
        <IconButton label="Bullet list" onClick={() => run("bulletList")}>
          <IconBulletList />
        </IconButton>
        <IconButton label="Block quotation" onClick={() => run("quote")}>
          <IconQuote />
        </IconButton>
      </div>
    </div>
  );
}

export function FormatToolbar({ editor }: FormatToolbarProps) {
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const refresh = () => setRevision((value) => value + 1);
    editor.on("transaction", refresh);
    editor.on("selectionUpdate", refresh);
    return () => {
      editor.off("transaction", refresh);
      editor.off("selectionUpdate", refresh);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const run = (command: () => boolean) => {
    command();
    editor.commands.focus();
  };

  return (
    <div className="format-bar" role="toolbar" aria-label="Formatting">
      <div className="format-bar-group" aria-label="Character style">
        <IconButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        >
          <IconBold />
        </IconButton>
        <IconButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        >
          <IconItalic />
        </IconButton>
        <IconButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
        >
          <IconUnderline />
        </IconButton>
        <IconButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <IconStrike />
        </IconButton>
        <IconButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => run(() => editor.chain().focus().toggleCode().run())}
        >
          <IconCode />
        </IconButton>
      </div>

      <FormatDivider />

      <div className="format-bar-group" aria-label="Headings">
        {([1, 2, 3, 4, 5] as const).map((level) => (
          <HeadingButton key={level} level={level} editor={editor} run={run} />
        ))}
        <IconButton
          label="Body paragraph"
          active={editor.isActive("paragraph") && !editor.isActive("heading")}
          onClick={() => run(() => editor.chain().focus().setParagraph().run())}
        >
          <span className="format-text-label-muted">¶</span>
        </IconButton>
      </div>

      <FormatDivider />

      <div className="format-bar-group" aria-label="Lists">
        <IconButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          <IconNumberedList />
        </IconButton>
        <IconButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          <IconBulletList />
        </IconButton>
        <IconButton
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => run(() => editor.chain().focus().toggleTaskList().run())}
        >
          <IconTaskList />
        </IconButton>
      </div>

      <FormatDivider />

      <div className="format-bar-group" aria-label="Blocks">
        <IconButton
          label="Block quotation"
          active={editor.isActive("blockquote")}
          onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
        >
          <IconQuote />
        </IconButton>
        <IconButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => run(() => editor.chain().focus().toggleCodeBlock().run())}
        >
          <IconCodeBlock />
        </IconButton>
        <IconButton
          label="Scene break"
          onClick={() =>
            run(() => editor.chain().focus().insertContent({ type: "sceneBreak" }).run())
          }
        >
          <IconSceneBreak />
        </IconButton>
      </div>
    </div>
  );
}
