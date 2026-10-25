import type { Editor } from "@tiptap/core";
import { IconButton } from "./IconButton";

export interface FormatToolbarProps {
  editor: Editor | null;
}

function IconBold() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5zm0 2v5h5.5a3.5 3.5 0 0 0 0-7H8z" />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 5h8v2h-3l-4 10h3v2H6v-2h3l4-10h-3V5z" />
    </svg>
  );
}

function IconUnderline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5v7a5 5 0 0 0 10 0V5h2v7a7 7 0 0 1-14 0V5h2zm-2 14h16v2H5v-2z" />
    </svg>
  );
}

function IconQuote() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 7h4v4H9.5a2.5 2.5 0 0 0 0 5H7v-2h2.5a.5.5 0 0 0 0-1H7V7zm10 0h-4v4h1.5a2.5 2.5 0 0 1 0 5H17v-2h-2.5a.5.5 0 0 0 0-1H17V7z" />
    </svg>
  );
}

function IconSceneBreak() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 12h12v1.5H6V12zm0 4h12v1.5H6V16z" />
    </svg>
  );
}

export function FormatToolbar({ editor }: FormatToolbarProps) {
  if (!editor) {
    return null;
  }

  const run = (command: () => boolean) => {
    command();
    editor.commands.focus();
  };

  return (
    <div className="format-bar" role="toolbar" aria-label="Formatting">
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

      <span className="format-bar-divider" aria-hidden />

      {[1, 2, 3].map((level) => (
        <IconButton
          key={level}
          label={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() =>
            run(() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run(),
            )
          }
        >
          <span className="format-text-label">H{level}</span>
        </IconButton>
      ))}

      <IconButton
        label="Paragraph"
        active={editor.isActive("paragraph") && !editor.isActive("heading")}
        onClick={() => run(() => editor.chain().focus().setParagraph().run())}
      >
        <span className="format-text-label-muted">¶</span>
      </IconButton>

      <span className="format-bar-divider" aria-hidden />

      <IconButton
        label="Block quotation"
        active={editor.isActive("blockquote")}
        onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
      >
        <IconQuote />
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
  );
}
