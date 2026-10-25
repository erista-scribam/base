import { useMemo, type CSSProperties } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { MARKDOWN_BODY_COLUMN_CH, markdownSourceExtensions } from "../features/markdown/codemirror-markdown-layout";
import { useTheme } from "../hooks/useTheme";
import type { MarkdownRulerMode, MarkdownRulerPreset } from "../hooks/useMarkdownRuler";
import { totalRulerCh } from "../hooks/useMarkdownRuler";
import { MarkdownRuler } from "./MarkdownRuler";

export interface MarkdownSourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  rulerMode: MarkdownRulerMode;
  onRulerSelectColumns: (columns: MarkdownRulerPreset) => void;
  onRulerSelectFullWidth: () => void;
  "aria-label"?: string;
}

export function MarkdownSourceEditor({
  value,
  onChange,
  rulerMode,
  onRulerSelectColumns,
  onRulerSelectFullWidth,
  "aria-label": ariaLabel,
}: MarkdownSourceEditorProps) {
  const { theme } = useTheme();
  const extensions = useMemo(() => markdownSourceExtensions(), []);
  const totalCh = totalRulerCh(rulerMode);

  const stackStyle = {
    "--md-marker-ch": MARKDOWN_BODY_COLUMN_CH,
    "--md-ruler-body-ch": rulerMode.kind === "columns" ? rulerMode.columns : 72,
    "--md-ruler-total-ch": totalCh ?? MARKDOWN_BODY_COLUMN_CH + 72,
  } as CSSProperties;

  return (
    <div
      className="markdown-source-stack"
      data-ruler={rulerMode.kind === "full" ? "full" : "columns"}
      style={stackStyle}
    >
      <MarkdownRuler
        mode={rulerMode}
        onSelectColumns={onRulerSelectColumns}
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
