import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";

const activeSentenceMark = Decoration.mark({ class: "cm-md-active-sentence" });

function sentenceRangeAt(text: string, offset: number): { from: number; to: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let from = clamped;
  let to = clamped;

  while (from > 0) {
    const ch = text[from - 1];
    if (ch === "\n" || ch === "." || ch === "!" || ch === "?") {
      break;
    }
    from -= 1;
  }
  while (from < text.length && /\s/u.test(text[from] ?? "")) {
    from += 1;
  }

  while (to < text.length) {
    const ch = text[to];
    if (ch === "\n" || ch === "." || ch === "!" || ch === "?") {
      if (ch !== "\n") {
        to += 1;
      }
      break;
    }
    to += 1;
  }

  if (to <= from) {
    return { from: clamped, to: Math.min(text.length, clamped + 1) };
  }
  return { from, to };
}

function buildActiveSentenceDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  const offsetInLine = head - line.from;
  const { from, to } = sentenceRangeAt(line.text, offsetInLine);
  if (to > from) {
    builder.add(line.from + from, line.from + to, activeSentenceMark);
  }
  return builder.finish();
}

export const markdownActiveSentenceExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildActiveSentenceDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        this.decorations = buildActiveSentenceDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
