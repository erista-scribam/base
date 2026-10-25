import type { CSSProperties } from "react";
import { MARKDOWN_BODY_COLUMN_CH } from "../features/markdown/codemirror-markdown-layout";
import {
  MARKDOWN_RULER_PRESETS,
  type MarkdownRulerMode,
  type MarkdownRulerPreset,
  totalRulerCh,
} from "../hooks/useMarkdownRuler";

export interface MarkdownRulerProps {
  mode: MarkdownRulerMode;
  onSelectColumns: (columns: MarkdownRulerPreset) => void;
  onSelectFullWidth: () => void;
}

function bodyTicks(bodyColumns: number): number[] {
  const ticks: number[] = [];
  for (let value = 10; value < bodyColumns; value += 10) {
    ticks.push(value);
  }
  ticks.push(bodyColumns);
  return ticks;
}

export function MarkdownRuler({ mode, onSelectColumns, onSelectFullWidth }: MarkdownRulerProps) {
  const bodyColumns = mode.kind === "columns" ? mode.columns : null;
  const totalCh = totalRulerCh(mode);

  const stackStyle = {
    "--md-marker-ch": MARKDOWN_BODY_COLUMN_CH,
    "--md-ruler-body-ch": bodyColumns ?? 72,
    "--md-ruler-total-ch": totalCh ?? MARKDOWN_BODY_COLUMN_CH + 72,
  } as CSSProperties;

  return (
    <div className="markdown-ruler" style={stackStyle}>
      <div className="markdown-ruler-controls">
        <label className="markdown-ruler-label" htmlFor="markdown-ruler-width">
          Line guide
        </label>
        <select
          id="markdown-ruler-width"
          className="markdown-ruler-select"
          value={mode.kind === "full" ? "full" : String(mode.columns)}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "full") {
              onSelectFullWidth();
              return;
            }
            const columns = Number(value) as MarkdownRulerPreset;
            if (MARKDOWN_RULER_PRESETS.includes(columns)) {
              onSelectColumns(columns);
            }
          }}
        >
          {MARKDOWN_RULER_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset} characters
            </option>
          ))}
          <option value="full">No guide (full width)</option>
        </select>
      </div>

      {mode.kind === "columns" && bodyColumns != null && totalCh != null ? (
        <div className="markdown-ruler-scale" aria-hidden>
          <div className="markdown-ruler-scale-inner">
            <div className="markdown-ruler-marker-zone" title="Markdown markers">
              <span className="markdown-ruler-zone-label"># · &gt;</span>
            </div>
            <div
              className="markdown-ruler-body-zone"
              style={{ width: `calc(${bodyColumns} * 1ch)` }}
            >
              {bodyTicks(bodyColumns).map((tick) => (
                <span
                  key={tick}
                  className="markdown-ruler-tick"
                  style={{ left: `calc(${tick} * 1ch)` }}
                >
                  {tick}
                </span>
              ))}
              <span className="markdown-ruler-guide" title={`Guide at ${bodyColumns} characters`} />
            </div>
          </div>
        </div>
      ) : (
        <div className="markdown-ruler-scale markdown-ruler-scale-off" aria-hidden>
          <span className="markdown-ruler-off-hint">Guide off — text uses full column width</span>
        </div>
      )}
    </div>
  );
}
