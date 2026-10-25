import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import type { ProsaDocument } from "@scribo/document-model";
import { useEffect, useRef } from "react";
import { SceneBreak } from "./scene-break";
import { prosaDocumentFromTiptapJson, tiptapJsonFromProsaDocument } from "./prosa-convert";

export interface ProsaEditorProps {
  document: ProsaDocument;
  onDocumentChange: (document: ProsaDocument) => void;
}

export function ProsaEditor({ document, onDocumentChange }: ProsaEditorProps) {
  const skipNextUpdate = useRef(true);

  useEffect(() => {
    skipNextUpdate.current = false;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5] }),
      Blockquote,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      SceneBreak,
    ],
    content: tiptapJsonFromProsaDocument(document),
    onUpdate: ({ editor: ed }) => {
      if (skipNextUpdate.current) {
        return;
      }
      onDocumentChange(prosaDocumentFromTiptapJson(document, ed.getJSON()));
    },
    editorProps: {
      attributes: {
        class: "prose-editor",
        spellcheck: "true",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    skipNextUpdate.current = true;
    editor.commands.setContent(tiptapJsonFromProsaDocument(document), { emitUpdate: false });
    skipNextUpdate.current = false;
    // Intentionally keyed on manuscript document id only (not every edit).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- external reload when switching manuscripts
  }, [document.id, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="manuscript-root rounded-lg border border-[var(--scribo-ui-border)] bg-[var(--scribo-ui-surface)] p-8 shadow-sm">
      <EditorContent editor={editor} />
    </div>
  );
}
