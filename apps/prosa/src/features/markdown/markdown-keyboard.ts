import { deleteMarkupBackward } from "@codemirror/lang-markdown";
import { EditorSelection, Prec, type EditorState, type TransactionSpec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { lineMarkerMeta, type LineMarkerMeta } from "./codemirror-markdown-layout";

/**
 * Sole Enter / Backspace policy for Prosa markdown source.
 * @see docs/specs/markdown-source-keyboard.md
 *
 * CodeMirror’s bundled `markdownKeymap` is disabled (`addKeymap: false`) because
 * `insertNewlineContinueMarkup` follows the syntax tree and will insert `>`
 * on plain lines still inside a Blockquote node (lazy continuations).
 */

function lineBody(text: string, meta: LineMarkerMeta): string {
  if (meta.kind === "quote") {
    return text.replace(/^>\s?/, "").trim();
  }
  if (meta.kind === "heading") {
    return text.replace(/^#{1,6}\s+/, "").trim();
  }
  if (meta.kind === "list") {
    return text.replace(/^(\d+\.\s+\[[ xX]\]\s|[-*+]\s+\[[ xX]\]\s|\d+\.\s|[-*+]\s)/, "").trim();
  }
  return text.trim();
}

function listContinuationPrefix(lineText: string): string {
  const taskBullet = /^[-*+]\s+\[[ xX]\]\s/.exec(lineText);
  if (taskBullet) {
    return taskBullet[0];
  }
  const taskOrdered = /^\d+\.\s+\[[ xX]\]\s/.exec(lineText);
  if (taskOrdered) {
    return taskOrdered[0];
  }
  const ordered = /^(\d+\.\s)/.exec(lineText);
  if (ordered?.[1]) {
    return ordered[1];
  }
  const bullet = /^([-*+]\s)/.exec(lineText);
  if (bullet?.[1]) {
    return bullet[1];
  }
  return "- ";
}

function blockContinuationPrefix(lineText: string, meta: LineMarkerMeta): string | null {
  if (meta.kind === "quote") {
    return "> ";
  }
  if (meta.kind === "list") {
    return listContinuationPrefix(lineText);
  }
  return null;
}

function exitEmptyBlockLine(line: { from: number; to: number }): TransactionSpec {
  return {
    changes: { from: line.from, to: line.to, insert: "" },
    selection: EditorSelection.cursor(line.from),
  };
}

function continueBlockLine(
  state: EditorState,
  line: { from: number; to: number },
  prefix: string,
): TransactionSpec {
  const { from } = state.selection.main;
  const after = state.sliceDoc(from, line.to);
  const insert = `\n${prefix}${after}`;
  const cursor = from + 1 + prefix.length;
  return {
    changes: { from, to: line.to, insert },
    selection: EditorSelection.cursor(cursor),
  };
}

function plainNewlineAtCursor(state: EditorState): TransactionSpec {
  const { from, to } = state.selection.main;
  const line = state.doc.lineAt(from);
  const after = state.sliceDoc(from, line.to);
  if (from === line.to) {
    return {
      changes: { from, to, insert: "\n" },
      selection: EditorSelection.cursor(from + 1),
    };
  }
  return {
    changes: { from, to: line.to, insert: `\n${after}` },
    selection: EditorSelection.cursor(from + 1),
  };
}

/** @internal */
export function planMarkdownEnter(state: EditorState): TransactionSpec {
  const line = state.doc.lineAt(state.selection.main.head);
  const meta = lineMarkerMeta(line.text);
  const body = lineBody(line.text, meta);

  if (meta.kind === "quote" || meta.kind === "list") {
    if (body.length === 0) {
      return exitEmptyBlockLine(line);
    }
    const prefix = blockContinuationPrefix(line.text, meta);
    if (prefix) {
      return continueBlockLine(state, line, prefix);
    }
  }

  if (meta.kind === "heading" && body.length === 0) {
    return exitEmptyBlockLine(line);
  }

  return plainNewlineAtCursor(state);
}

function runMarkdownEnter(view: import("@codemirror/view").EditorView): boolean {
  view.dispatch(planMarkdownEnter(view.state));
  return true;
}

/** iA Writer: Shift+Enter = hard line break (`  \n`). */
function runMarkdownShiftEnter(view: import("@codemirror/view").EditorView): boolean {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: "  \n" },
    selection: { anchor: from + 3 },
  });
  return true;
}

/**
 * Must be registered once on the markdown editor. Uses `Prec.highest` so CM’s
 * default markdown Enter (`insertNewlineContinueMarkup`) never runs.
 */
export function prosaMarkdownKeyboardExtension() {
  return Prec.highest(
    keymap.of([
      { key: "Enter", run: runMarkdownEnter },
      { key: "Shift-Enter", run: runMarkdownShiftEnter },
      { key: "Backspace", run: deleteMarkupBackward },
    ]),
  );
}
