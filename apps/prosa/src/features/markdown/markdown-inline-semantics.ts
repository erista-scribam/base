import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { MARKDOWN_SEMANTIC_CM_CLASS, buildLineSemanticSpans } from "@scribam/markdown-semantics";

const marks = {
  dialog: Decoration.mark({ class: MARKDOWN_SEMANTIC_CM_CLASS.dialog }),
  delimiter: Decoration.mark({ class: MARKDOWN_SEMANTIC_CM_CLASS.delimiter }),
  underline: Decoration.mark({ class: MARKDOWN_SEMANTIC_CM_CLASS.underline }),
} as const;

function buildInlineSemanticsDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    for (const span of buildLineSemanticSpans(line.text)) {
      builder.add(line.from + span.from, line.from + span.to, marks[span.kind]);
    }
  }
  return builder.finish();
}

/** CodeMirror adapter for @scribam/markdown-semantics inline spans. */
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
