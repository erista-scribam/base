import { Decoration, EditorView, MatchDecorator, ViewPlugin, type DecorationSet } from "@codemirror/view";

const dialogMark = Decoration.mark({ class: "cm-md-dialog" });

/** ASCII `"…"` and typographic “…” (common on macOS). */
const DIALOG_QUOTED = /"[^"\n]+"|\u201c[^\u201d\n]+\u201d/g;

const dialogMatcher = new MatchDecorator({
  regexp: DIALOG_QUOTED,
  decoration: dialogMark,
  boundary: /[\s"'\u2018\u2019\u201c\u201d]/,
});

export const markdownDialogHighlightExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = dialogMatcher.createDeco(view);
    }

    update(update: import("@codemirror/view").ViewUpdate) {
      this.decorations = dialogMatcher.updateDeco(update, this.decorations);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
