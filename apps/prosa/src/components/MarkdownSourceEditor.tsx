import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdownSourceExtensions } from "../features/markdown/codemirror-markdown-layout";
import { useTheme } from "../hooks/useTheme";

export interface MarkdownSourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
}

export function MarkdownSourceEditor({
  value,
  onChange,
  "aria-label": ariaLabel,
}: MarkdownSourceEditorProps) {
  const { theme } = useTheme();
  const extensions = useMemo(() => markdownSourceExtensions(), []);

  return (
    <div className="markdown-source-stack">
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
