import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import type { Editor } from "@tiptap/core";
import { serializeProsaDocument, type ProsaDocument } from "@scribo/document-model";
import { ProsaEditor } from "../editor/ProsaEditor";
import { ManuscriptPreview } from "./ManuscriptPreview";
import { MarkdownSectionOutline } from "./MarkdownSectionOutline";
import { MarkdownSourceEditor, type MarkdownSourceEditorHandle } from "./MarkdownSourceEditor";
import {
  markdownToProsaDocument,
  prosaDocumentToAuthorMarkdown,
} from "../features/markdown/prosa-markdown";
import { useMarkdownRuler } from "../hooks/useMarkdownRuler";
import type { MarkdownFormatAction } from "../features/markdown/markdown-source-format";

export type EditorViewMode = "proper" | "minimalist";
export type MarkdownSideTab = "preview" | "sections";

export interface EditorWorkspaceProps {
  document: ProsaDocument;
  viewMode: EditorViewMode;
  markdownPreviewVisible: boolean;
  onToggleMarkdownPreview: () => void;
  onDocumentChange: (document: ProsaDocument) => void;
  onEditorReady: (editor: Editor | null) => void;
  editorZoom: number;
}

export interface EditorWorkspaceHandle {
  applyMarkdownFormat(action: MarkdownFormatAction): void;
}

export const EditorWorkspace = forwardRef<EditorWorkspaceHandle, EditorWorkspaceProps>(
  function EditorWorkspace(
    {
      document,
      viewMode,
      markdownPreviewVisible,
      onToggleMarkdownPreview,
      onDocumentChange,
      onEditorReady,
      editorZoom,
    },
    ref,
  ) {
    const [markdown, setMarkdown] = useState(() => prosaDocumentToAuthorMarkdown(document));
    const [sideTab, setSideTab] = useState<MarkdownSideTab>("sections");
    const [cursorLine, setCursorLine] = useState<number | null>(null);
    const markdownEditorRef = useRef<MarkdownSourceEditorHandle>(null);
    const documentRef = useRef(document);
    const markdownRef = useRef(markdown);
    const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { rulerMode, setLineLengthPreset, setRulerFullWidth } = useMarkdownRuler();

    useImperativeHandle(
      ref,
      () => ({
        applyMarkdownFormat(action: MarkdownFormatAction) {
          markdownEditorRef.current?.applyFormat(action);
        },
      }),
      [],
    );

    const previewDocument = useMemo(
      () => markdownToProsaDocument(document, markdown),
      [document, markdown],
    );

    useEffect(() => {
      documentRef.current = document;
    }, [document]);

    useEffect(() => {
      markdownRef.current = markdown;
    }, [markdown]);

    useEffect(() => {
      if (viewMode !== "minimalist") {
        return;
      }
      // Source of truth when opening markdown: serialize the structured doc once per manuscript/mode.
      setMarkdown(prosaDocumentToAuthorMarkdown(documentRef.current));
    }, [document.id, viewMode]);

    useEffect(
      () => () => {
        if (parseTimerRef.current) {
          clearTimeout(parseTimerRef.current);
        }
      },
      [],
    );

    useEffect(() => {
      if (viewMode !== "proper") {
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
      // Apply source → model when entering proper mode so TipTap receives full content.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- only when view mode flips
    }, [viewMode]);

    const handleMarkdownChange = useCallback(
      (value: string) => {
        setMarkdown(value);
        if (parseTimerRef.current) {
          clearTimeout(parseTimerRef.current);
        }
        parseTimerRef.current = setTimeout(() => {
          onDocumentChange(markdownToProsaDocument(documentRef.current, value));
        }, 200);
      },
      [onDocumentChange],
    );

    const handleGoToLine = useCallback((line: number) => {
      markdownEditorRef.current?.goToLine(line);
    }, []);

    if (viewMode === "proper") {
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
            <span className="editor-split-label-title">Source</span>
            <span className="editor-split-label-hint">
              ⌘↑/↓ section · Ctrl+↑/↓ paragraph · headings &amp; scene breaks define sections
            </span>
          </div>
          <MarkdownSourceEditor
            ref={markdownEditorRef}
            value={markdown}
            onChange={handleMarkdownChange}
            rulerMode={rulerMode}
            onSelectLineLengthPreset={setLineLengthPreset}
            onRulerSelectFullWidth={setRulerFullWidth}
            editorZoom={editorZoom}
            onCursorLineChange={setCursorLine}
            aria-label="Manuscript source"
          />
        </div>
        {markdownPreviewVisible ? (
          <div className="editor-split-pane editor-split-preview">
            <div className="editor-split-label editor-split-label-row editor-split-side-tabs">
              <div className="editor-side-tablist" role="tablist" aria-label="Side panel">
                <button
                  type="button"
                  role="tab"
                  className="editor-side-tab"
                  aria-selected={sideTab === "sections"}
                  data-active={sideTab === "sections" ? "true" : undefined}
                  onClick={() => setSideTab("sections")}
                >
                  Sections
                </button>
                <button
                  type="button"
                  role="tab"
                  className="editor-side-tab"
                  aria-selected={sideTab === "preview"}
                  data-active={sideTab === "preview" ? "true" : undefined}
                  onClick={() => setSideTab("preview")}
                >
                  Preview
                </button>
              </div>
              <button type="button" className="text-btn" onClick={onToggleMarkdownPreview}>
                Hide panel
              </button>
            </div>
            <div className="editor-split-preview-scroll">
              {sideTab === "preview" ? (
                <ManuscriptPreview document={previewDocument} />
              ) : (
                <MarkdownSectionOutline
                  markdown={markdown}
                  activeLine={cursorLine}
                  onGoToLine={handleGoToLine}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="editor-split-preview-collapsed">
            <button type="button" className="sidebar-footer-btn" onClick={onToggleMarkdownPreview}>
              Show panel
            </button>
          </div>
        )}
      </div>
    );
  },
);
