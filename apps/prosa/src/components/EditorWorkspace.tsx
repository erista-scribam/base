import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ProsaDocument } from "@scribo/document-model";
import { ProsaEditor } from "../editor/ProsaEditor";
import { ManuscriptPreview } from "./ManuscriptPreview";
import { MarkdownSourceEditor } from "./MarkdownSourceEditor";
import {
  markdownToProsaDocument,
  prosaDocumentToMarkdown,
} from "../features/markdown/prosa-markdown";

export type EditorViewMode = "classic" | "split";

export interface EditorWorkspaceProps {
  document: ProsaDocument;
  viewMode: EditorViewMode;
  onDocumentChange: (document: ProsaDocument) => void;
  onEditorReady: (editor: Editor | null) => void;
}

export function EditorWorkspace({
  document,
  viewMode,
  onDocumentChange,
  onEditorReady,
}: EditorWorkspaceProps) {
  const [markdown, setMarkdown] = useState(() => prosaDocumentToMarkdown(document));
  const documentRef = useRef(document);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdown(value);
      onDocumentChange(markdownToProsaDocument(documentRef.current, value));
    },
    [onDocumentChange],
  );

  if (viewMode === "classic") {
    return (
      <div className="editor-canvas-wrap">
        <ProsaEditor
          document={document}
          onDocumentChange={onDocumentChange}
          onEditorReady={onEditorReady}
        />
      </div>
    );
  }

  return (
    <div className="editor-split">
      <div className="editor-split-pane editor-split-source">
        <div className="editor-split-label">Markdown source</div>
        <MarkdownSourceEditor
          value={markdown}
          onChange={handleMarkdownChange}
          aria-label="Markdown source"
        />
      </div>
      <div className="editor-split-pane editor-split-preview">
        <div className="editor-split-label">Preview</div>
        <div className="editor-split-preview-scroll">
          <ManuscriptPreview document={document} />
        </div>
      </div>
    </div>
  );
}
