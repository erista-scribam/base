import {
  IA_LINE_LENGTHS,
  type MarkdownWrapMode,
  type IaLineLength,
} from "../hooks/useMarkdownRuler";

export interface MarkdownRulerProps {
  mode: MarkdownWrapMode;
  onSelectLineLength: (columns: IaLineLength) => void;
  onSelectFullWidth: () => void;
}

export function MarkdownRuler({
  mode,
  onSelectLineLength,
  onSelectFullWidth,
}: MarkdownRulerProps) {
  return (
    <div className="markdown-guide-bar">
      <label className="markdown-guide-label" htmlFor="markdown-line-length">
        Line length
      </label>
      <select
        id="markdown-line-length"
        className="markdown-guide-select"
        value={mode.kind === "full" ? "full" : String(mode.columns)}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "full") {
            onSelectFullWidth();
            return;
          }
          const columns = Number(value) as IaLineLength;
          if (IA_LINE_LENGTHS.includes(columns)) {
            onSelectLineLength(columns);
          }
        }}
      >
        {IA_LINE_LENGTHS.map((columns) => (
          <option key={columns} value={columns}>
            {columns}
          </option>
        ))}
        <option value="full">Full width</option>
      </select>
    </div>
  );
}
