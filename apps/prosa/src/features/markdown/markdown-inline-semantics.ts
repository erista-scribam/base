import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";

/** ASCII `"…"` and typographic “…” (common on macOS). */
export const DIALOG_QUOTED_PATTERN = /"[^"\n]+"|\u201c[^\u201d\n]+\u201d/g;

const UNDERLINE_PATTERN = /<u>[^<\n]+<\/u>/g;

const dialogMark = Decoration.mark({ class: "cm-md-tok-dialog" });
const underlineMark = Decoration.mark({ class: "cm-md-tok-underline" });

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

function rangesForPattern(
  text: string,
  pattern: RegExp,
): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    ranges.push({ from: match.index, to: match.index + match[0].length });
  }
  return ranges;
}

function buildInlineSemanticsDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    for (const { from, to } of dialogQuotedRangesInLine(line.text)) {
      if (to > from) {
        builder.add(line.from + from, line.from + to, dialogMark);
      }
    }
    for (const { from, to } of rangesForPattern(line.text, UNDERLINE_PATTERN)) {
      if (to > from) {
        builder.add(line.from + from, line.from + to, underlineMark);
      }
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
