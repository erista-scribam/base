import {
  EditorView,
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

function bottomPadStyle(view: EditorView): string {
  const stack = view.dom.closest(".markdown-source-stack");
  const raw = stack
    ? getComputedStyle(stack).getPropertyValue("--scribam-editor-pad-bottom").trim()
    : "";
  const pad = raw || "max(12rem, 48vh)";
  return `--md-bottom-pad:${pad};padding-bottom:var(--md-bottom-pad);`;
}

function buildBottomPadDecorations(view: EditorView): DecorationSet {
  const lines = view.state.doc.lines;
  if (lines < 1) {
    return Decoration.none;
  }
  const last = view.state.doc.line(lines);
  const builder = new RangeSetBuilder<Decoration>();
  builder.add(
    last.from,
    last.from,
    Decoration.line({
      class: "cm-md-last-line",
      attributes: { style: bottomPadStyle(view) },
    }),
  );
  return builder.finish();
}

/** Scrollable tail room below the last line (line padding, not an EOF widget). */
export const markdownEditorBottomSpace = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildBottomPadDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.geometryChanged) {
        this.decorations = buildBottomPadDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
