import { Compartment, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  markdownGuideExtension,
  relayoutMarkdownColumnGuide,
} from "../features/markdown/markdown-column-guide";
import { markdownSourceExtensions } from "../features/markdown/codemirror-markdown-layout";
import { useTheme } from "../hooks/useTheme";
import {
  columnsForWrapMode,
  type IaLineLength,
  type MarkdownWrapMode,
} from "../hooks/useMarkdownRuler";
import { MarkdownRuler } from "./MarkdownRuler";

const guideCompartment = new Compartment();

function bodyColumnLimit(mode: MarkdownWrapMode): number | null {
  return columnsForWrapMode(mode);
}

function guideExtensionFor(mode: MarkdownWrapMode, editorZoom: number) {
  return markdownGuideExtension(bodyColumnLimit(mode), editorZoom);
}

export interface MarkdownSourceEditorHandle {
  goToLine(line: number): void;
}

export interface MarkdownSourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  rulerMode: MarkdownWrapMode;
  onSelectLineLength: (columns: IaLineLength) => void;
  onRulerSelectFullWidth: () => void;
  editorZoom: number;
  onCursorLineChange?: (line: number) => void;
  "aria-label"?: string;
}

export const MarkdownSourceEditor = forwardRef<
  MarkdownSourceEditorHandle,
  MarkdownSourceEditorProps
>(function MarkdownSourceEditor(
  {
    value,
    onChange,
    rulerMode,
    onSelectLineLength,
    onRulerSelectFullWidth,
    editorZoom,
    onCursorLineChange,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const { theme } = useTheme();
  const editorViewRef = useRef<EditorView | null>(null);
  const programmaticNavRef = useRef(false);

  const extensions = useMemo(
    () => [
      ...markdownSourceExtensions(),
      guideCompartment.of(guideExtensionFor(rulerMode, editorZoom)),
    ],
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      goToLine(line: number) {
        const view = editorViewRef.current;
        if (!view) {
          return;
        }
        const lineNumber = Math.min(Math.max(1, line), view.state.doc.lines);
        const docLine = view.state.doc.line(lineNumber);
        programmaticNavRef.current = true;
        view.dispatch({
          selection: EditorSelection.cursor(docLine.from),
          effects: EditorView.scrollIntoView(docLine.from, { y: "start", yMargin: 72 }),
          scrollIntoView: true,
        });
        requestAnimationFrame(() => {
          view.focus();
          programmaticNavRef.current = false;
          onCursorLineChange?.(lineNumber);
        });
      },
    }),
    [onCursorLineChange],
  );

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: guideCompartment.reconfigure(guideExtensionFor(rulerMode, editorZoom)),
    });
  }, [rulerMode, editorZoom]);

  return (
    <div className="markdown-source-stack">
      <MarkdownRuler
        mode={rulerMode}
        onSelectLineLength={onSelectLineLength}
        onSelectFullWidth={onRulerSelectFullWidth}
      />
      <CodeMirror
        key={theme}
        value={value}
        height="100%"
        theme="none"
        className="markdown-codemirror"
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={(view) => {
          editorViewRef.current = view;
          relayoutMarkdownColumnGuide(view);
          const head = view.state.selection.main.head;
          onCursorLineChange?.(view.state.doc.lineAt(head).number);
        }}
        onUpdate={(update) => {
          if (programmaticNavRef.current) {
            return;
          }
          if (!update.selectionSet && !update.focusChanged) {
            return;
          }
          const head = update.state.selection.main.head;
          onCursorLineChange?.(update.state.doc.lineAt(head).number);
        }}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          autocompletion: false,
          indentOnInput: false,
        }}
        indentWithTab={false}
        aria-label={ariaLabel}
      />
    </div>
  );
});
