import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/core";
import { serializeProsaDocument, type ProsaDocument } from "@scribo/document-model";
import { useEffect, useRef } from "react";
import { SceneBreak } from "./scene-break";
import { prosaDocumentFromTiptapJson, tiptapJsonFromProsaDocument } from "./prosa-convert";

export interface ProsaEditorProps {
  document: ProsaDocument;
  onDocumentChange: (document: ProsaDocument) => void;
  onEditorReady: (editor: Editor | null) => void;
}

export function ProsaEditor({ document, onDocumentChange, onEditorReady }: ProsaEditorProps) {
  const skipNextUpdate = useRef(true);
  const lastEditorSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    skipNextUpdate.current = false;
  }, []);

  useEffect(() => {
    lastEditorSnapshotRef.current = null;
  }, [document.id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Blockquote,
      CodeBlock,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      SceneBreak,
      Placeholder.configure({
        placeholder: "Begin writing…",
      }),
    ],
    content: tiptapJsonFromProsaDocument(document),
    onUpdate: ({ editor: ed }) => {
      if (skipNextUpdate.current) {
        return;
      }
      const next = prosaDocumentFromTiptapJson(document, ed.getJSON());
      try {
        lastEditorSnapshotRef.current = serializeProsaDocument(next);
      } catch {
        lastEditorSnapshotRef.current = null;
      }
      onDocumentChange(next);
    },
    editorProps: {
      attributes: {
        class: "prose-editor",
        spellcheck: "true",
      },
    },
  });

  useEffect(() => {
    onEditorReady(editor);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    let incoming: string;
    try {
      incoming = serializeProsaDocument(document);
    } catch {
      return;
    }
    if (lastEditorSnapshotRef.current === incoming) {
      return;
    }
    skipNextUpdate.current = true;
    editor.commands.setContent(tiptapJsonFromProsaDocument(document), { emitUpdate: false });
    skipNextUpdate.current = false;
    lastEditorSnapshotRef.current = incoming;
  }, [document, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="manuscript-root">
      <EditorContent editor={editor} />
    </div>
  );
}
