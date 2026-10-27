import { dialogQuotedRangesInLine } from "./dialog";
import { markupDelimiterRangesInLine } from "./delimiters";
import type { SemanticSpan } from "./kinds";
import { insideAny, sortRanges } from "./ranges";
import { underlineInnerRangesInLine } from "./underline";

/**
 * All presentation spans for one source line (line-local offsets).
 * Sorted ascending by `from` for CodeMirror RangeSetBuilder.
 */
export function buildLineSemanticSpans(lineText: string): SemanticSpan[] {
  const dialogSpans = dialogQuotedRangesInLine(lineText);
  const spans: SemanticSpan[] = [];

  for (const { from, to } of dialogSpans) {
    if (to > from) {
      spans.push({ from, to, kind: "dialog" });
    }
  }

  for (const { from, to } of underlineInnerRangesInLine(lineText)) {
    if (to > from) {
      spans.push({ from, to, kind: "underline" });
    }
  }

  for (const { from, to } of markupDelimiterRangesInLine(lineText)) {
    if (to > from && !insideAny({ from, to }, dialogSpans)) {
      spans.push({ from, to, kind: "delimiter" });
    }
  }

  return sortRanges(spans);
}

/** Absolute document offsets (for tests / non-CM consumers). */
export function buildLineSemanticSpansAt(
  lineText: string,
  lineStartOffset: number,
): Array<SemanticSpan & { docFrom: number; docTo: number }> {
  return buildLineSemanticSpans(lineText).map((span) => ({
    ...span,
    docFrom: lineStartOffset + span.from,
    docTo: lineStartOffset + span.to,
  }));
}
