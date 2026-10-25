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
  const [parseError, setParseError] = useState<string | null>(null);
  const documentRef = useRef(document);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdown(value);
      try {
        const next = markdownToProsaDocument(documentRef.current, value);
        setParseError(null);
        onDocumentChange(next);
      } catch (cause) {
        setParseError(cause instanceof Error ? cause.message : "Invalid markdown");
      }
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
        {parseError ? <div className="markdown-parse-error">{parseError}</div> : null}
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
