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
import { useMarkdownRuler } from "../hooks/useMarkdownRuler";

export type EditorViewMode = "classic" | "split";

export interface EditorWorkspaceProps {
  document: ProsaDocument;
  viewMode: EditorViewMode;
  markdownPreviewVisible: boolean;
  onToggleMarkdownPreview: () => void;
  onDocumentChange: (document: ProsaDocument) => void;
  onEditorReady: (editor: Editor | null) => void;
}

export function EditorWorkspace({
  document,
  viewMode,
  markdownPreviewVisible,
  onToggleMarkdownPreview,
  onDocumentChange,
  onEditorReady,
}: EditorWorkspaceProps) {
  const [markdown, setMarkdown] = useState(() => prosaDocumentToMarkdown(document));
  const documentRef = useRef(document);
  const markdownRef = useRef(markdown);
  const { rulerMode, setRulerColumns, setRulerFullWidth } = useMarkdownRuler();

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
      <div className="editor-canvas-wrap editor-canvas-classic">
        <ProsaEditor
          document={document}
          onDocumentChange={onDocumentChange}
          onEditorReady={onEditorReady}
        />
      </div>
    );
  }

  return (
    <div
      className="editor-split editor-markdown-workspace"
      data-preview={markdownPreviewVisible ? "true" : "false"}
    >
      <div className="editor-split-pane editor-split-source">
        <div className="editor-split-label editor-split-label-row">
          <span className="editor-split-label-title">Markdown source</span>
          <span className="editor-split-label-hint">One line = one paragraph · Enter for next</span>
        </div>
        <MarkdownSourceEditor
          value={markdown}
          onChange={handleMarkdownChange}
          rulerMode={rulerMode}
          onRulerSelectColumns={setRulerColumns}
          onRulerSelectFullWidth={setRulerFullWidth}
          aria-label="Markdown source"
        />
      </div>
      {markdownPreviewVisible ? (
        <div className="editor-split-pane editor-split-preview">
          <div className="editor-split-label editor-split-label-row">
            <span className="editor-split-label-title">Preview</span>
            <button type="button" className="text-btn" onClick={onToggleMarkdownPreview}>
              Hide preview
            </button>
          </div>
          <div className="editor-split-preview-scroll">
            <ManuscriptPreview document={document} />
          </div>
        </div>
      ) : (
        <div className="editor-split-preview-collapsed">
          <button type="button" className="sidebar-footer-btn" onClick={onToggleMarkdownPreview}>
            Show preview
          </button>
        </div>
      )}
    </div>
  );
}
