import { keymap } from "@codemirror/view";
import { EditorSelection, Prec } from "@codemirror/state";
import { lineMarkerMeta } from "./codemirror-markdown-layout";

function insertPlainNewline(view: import("@codemirror/view").EditorView): boolean {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: "\n" },
    selection: EditorSelection.cursor(from + 1),
  });
  return true;
}

function clearLinePrefix(view: import("@codemirror/view").EditorView): boolean {
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: "" },
    selection: EditorSelection.cursor(line.from),
  });
  return true;
}

/**
 * Prosa markdown: Enter always starts a plain paragraph line — no `>` or list continuation.
 */
function prosaMarkdownEnter(view: import("@codemirror/view").EditorView): boolean {
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  const meta = lineMarkerMeta(line.text);
  const body = line.text.slice(meta.markerCh).trim();

  if (meta.kind === "quote" || meta.kind === "list") {
    if (body.length === 0) {
      clearLinePrefix(view);
      return true;
    }
    return insertPlainNewline(view);
  }

  return insertPlainNewline(view);
}

/**
 * iA Writer: Shift+Enter inserts a Markdown hard line break (two spaces + newline).
 */
export const prosaMarkdownShiftEnterKeymap = Prec.high(
  keymap.of([
    {
      key: "Shift-Enter",
      run: (view) => {
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: "  \n" },
          selection: { anchor: from + 3 },
        });
        return true;
      },
    },
  ]),
);

export const prosaMarkdownEnterKeymap = Prec.high(
  keymap.of([
    {
      key: "Enter",
      run: prosaMarkdownEnter,
    },
  ]),
);
