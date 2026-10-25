import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { serializeProsaDocument, type ProsaDocument } from "@scribo/document-model";
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
  const markdownRef = useRef(markdown);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    if (viewMode !== "split") {
      return;
    }
    setMarkdown(prosaDocumentToMarkdown(documentRef.current));
  }, [document.id, viewMode]);

  useEffect(() => {
    if (viewMode !== "classic") {
      return;
    }
    const parsed = markdownToProsaDocument(documentRef.current, markdownRef.current);
    let parsedJson: string;
    let currentJson: string;
    try {
      parsedJson = serializeProsaDocument(parsed);
      currentJson = serializeProsaDocument(documentRef.current);
    } catch {
      return;
    }
    if (parsedJson !== currentJson) {
      onDocumentChange(parsed);
    }
    // Apply markdown → model when entering classic so TipTap receives full content.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when view mode flips
  }, [viewMode]);

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
