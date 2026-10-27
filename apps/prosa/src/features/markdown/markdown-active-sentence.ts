import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { sentenceRangeAt } from "./markdown-sentence-range";

const activeSentenceMark = Decoration.mark({ class: "cm-md-active-sentence" });

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
