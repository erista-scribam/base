import type { TextRange } from "./ranges";

const UNDERLINE_PATTERN = /<u>([^<\n]+)<\/u>/g;

export function underlineInnerRangesInLine(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  const re = new RegExp(UNDERLINE_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const innerStart = match.index + 3;
    const innerEnd = match.index + match[0].length - 4;
    if (innerEnd > innerStart) {
      ranges.push({ from: innerStart, to: innerEnd });
    }
  }
  return ranges;
}
