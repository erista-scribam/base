import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { markupDelimiterRangesInLine } from "./markdown-markup-delimiters";

/** ASCII `"…"` and typographic “…” (common on macOS). */
export const DIALOG_QUOTED_PATTERN = /"[^"\n]+"|\u201c[^\u201d\n]+\u201d/g;

const UNDERLINE_PATTERN = /<u>([^<\n]+)<\/u>/g;

const dialogMark = Decoration.mark({ class: "cm-md-tok-dialog" });
const underlineInnerMark = Decoration.mark({ class: "cm-md-tok-underline-text" });
const delimiterMark = Decoration.mark({ class: "cm-md-tok-delimiter" });

type LineRange = { from: number; to: number; mark: Decoration };

/** Find dialog spans on one line (for tests). */
export function dialogQuotedRangesInLine(text: string): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  const re = new RegExp(DIALOG_QUOTED_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    ranges.push({ from: match.index, to: match.index + match[0].length });
  }
  return ranges;
}

function insideAny(range: { from: number; to: number }, spans: Array<{ from: number; to: number }>) {
  return spans.some((span) => range.from >= span.from && range.to <= span.to);
}

/** CodeMirror RangeSetBuilder requires ascending `from` — merge per line before add. */
export function lineSemanticDecorationRanges(
  text: string,
  lineFrom: number,
): Array<{ from: number; to: number; classes: string }> {
  const dialogSpans = dialogQuotedRangesInLine(text);
  const pending: LineRange[] = [];

  for (const { from, to } of dialogSpans) {
    if (to > from) {
      pending.push({ from: lineFrom + from, to: lineFrom + to, mark: dialogMark });
    }
  }

  const underlineRe = new RegExp(UNDERLINE_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = underlineRe.exec(text)) !== null) {
    const innerStart = match.index + 3;
    const innerEnd = match.index + match[0].length - 4;
    if (innerEnd > innerStart) {
      pending.push({
        from: lineFrom + innerStart,
        to: lineFrom + innerEnd,
        mark: underlineInnerMark,
      });
    }
  }

  for (const { from, to } of markupDelimiterRangesInLine(text)) {
    if (insideAny({ from, to }, dialogSpans)) {
      continue;
    }
    pending.push({ from: lineFrom + from, to: lineFrom + to, mark: delimiterMark });
  }

  pending.sort((a, b) => a.from - b.from || a.to - b.to);
  return pending.map((entry) => ({
    from: entry.from,
    to: entry.to,
    classes: entry.mark.spec.class ?? "",
  }));
}

function buildInlineSemanticsDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    const dialogSpans = dialogQuotedRangesInLine(line.text);
    const pending: LineRange[] = [];

    for (const { from, to } of dialogSpans) {
      if (to > from) {
        pending.push({ from: line.from + from, to: line.from + to, mark: dialogMark });
      }
    }

    const underlineRe = new RegExp(UNDERLINE_PATTERN.source, "g");
    let match: RegExpExecArray | null;
    while ((match = underlineRe.exec(line.text)) !== null) {
      const innerStart = match.index + 3;
      const innerEnd = match.index + match[0].length - 4;
      if (innerEnd > innerStart) {
        pending.push({
          from: line.from + innerStart,
          to: line.from + innerEnd,
          mark: underlineInnerMark,
        });
      }
    }

    for (const { from, to } of markupDelimiterRangesInLine(line.text)) {
      if (insideAny({ from, to }, dialogSpans)) {
        continue;
      }
      pending.push({ from: line.from + from, to: line.from + to, mark: delimiterMark });
    }

    pending.sort((a, b) => a.from - b.from || a.to - b.to);
    for (const entry of pending) {
      builder.add(entry.from, entry.to, entry.mark);
    }
  }
  return builder.finish();
}

/** Permanent inline semantics (dialog, underline HTML) — distinct token colors via CSS. */
export const markdownInlineSemanticsExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildInlineSemanticsDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildInlineSemanticsDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
