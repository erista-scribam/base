import {
  MARKDOWN_LINE_LENGTH_PRESETS,
  type MarkdownWrapMode,
  type MarkdownLineLengthPresetId,
} from "../hooks/useMarkdownRuler";

export interface MarkdownRulerProps {
  mode: MarkdownWrapMode;
  onSelectPreset: (presetId: MarkdownLineLengthPresetId) => void;
  onSelectFullWidth: () => void;
}

export function MarkdownRuler({ mode, onSelectPreset, onSelectFullWidth }: MarkdownRulerProps) {
  const value = mode.kind === "full" ? "full" : mode.presetId;

  return (
    <div className="markdown-guide-bar">
      <label className="markdown-guide-label" htmlFor="markdown-line-length">
        Line length
      </label>
      <select
        id="markdown-line-length"
        className="markdown-guide-select"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "full") {
            onSelectFullWidth();
            return;
          }
          onSelectPreset(next as MarkdownLineLengthPresetId);
        }}
      >
        {MARKDOWN_LINE_LENGTH_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
        <option value="full">Full width</option>
      </select>
    </div>
  );
}
