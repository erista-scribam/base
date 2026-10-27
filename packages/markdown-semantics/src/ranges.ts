export type TextRange = { from: number; to: number };

export function insideAny(range: TextRange, spans: readonly TextRange[]): boolean {
  return spans.some((span) => range.from >= span.from && range.to <= span.to);
}

/** Sort for CodeMirror RangeSetBuilder (ascending `from`). */
export function sortRanges<T extends TextRange>(ranges: T[]): T[] {
  return [...ranges].sort((a, b) => a.from - b.from || a.to - b.to);
}
