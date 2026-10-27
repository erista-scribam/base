import type { TextRange } from "./ranges";

/** ASCII `"…"` and typographic “…” (common on macOS). */
export const DIALOG_QUOTED_PATTERN = /"[^"\n]+"|\u201c[^\u201d\n]+\u201d/g;

export function dialogQuotedRangesInLine(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  const re = new RegExp(DIALOG_QUOTED_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    ranges.push({ from: match.index, to: match.index + match[0].length });
  }
  return ranges;
}
