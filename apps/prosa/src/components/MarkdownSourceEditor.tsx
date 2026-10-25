import { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef } from "react";
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

export interface MarkdownSourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  rulerMode: MarkdownWrapMode;
  onSelectLineLength: (columns: IaLineLength) => void;
  onRulerSelectFullWidth: () => void;
  editorZoom: number;
  "aria-label"?: string;
}

export function MarkdownSourceEditor({
  value,
  onChange,
  rulerMode,
  onSelectLineLength,
  onRulerSelectFullWidth,
  editorZoom,
  "aria-label": ariaLabel,
}: MarkdownSourceEditorProps) {
  const { theme } = useTheme();
  const editorViewRef = useRef<EditorView | null>(null);

  const extensions = useMemo(
    () => [
      ...markdownSourceExtensions(),
      guideCompartment.of(guideExtensionFor(rulerMode, editorZoom)),
    ],
    [],
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
}
