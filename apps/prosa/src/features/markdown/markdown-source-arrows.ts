import {
  cursorLineDown,
  cursorLineEnd,
  cursorLineStart,
  cursorLineUp,
  selectLineEnd,
  selectLineStart,
} from "@codemirror/commands";
import { EditorSelection, Prec } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import { targetPosOnSiblingLine } from "./markdown-line-nav";
import { targetSectionEnd, targetSectionStart } from "./markdown-section-nav";

function visualLineStart(view: EditorView, pos: number): number {
  return view.moveToLineBoundary(EditorSelection.cursor(pos), false, true).head;
}

function visualLineEnd(view: EditorView, pos: number): number {
  return view.moveToLineBoundary(EditorSelection.cursor(pos), true, true).head;
}

/** iA Writer ⌥↑ — start of this wrapped line, or start of previous wrapped line. */
function cursorStartOfThisOrPreviousLine(view: EditorView, extend: boolean): boolean {
  const head = view.state.selection.main.head;
  const anchor = view.state.selection.main.anchor;
  const start = visualLineStart(view, head);
  if (head > start) {
    view.dispatch({
      selection: extend ? EditorSelection.range(anchor, start) : EditorSelection.cursor(start),
      scrollIntoView: true,
    });
    return true;
  }
  if (!cursorLineUp(view)) {
    return false;
  }
  const afterUp = view.state.selection.main.head;
  const prevStart = visualLineStart(view, afterUp);
  view.dispatch({
    selection: extend
      ? EditorSelection.range(anchor, prevStart)
      : EditorSelection.cursor(prevStart),
    scrollIntoView: true,
  });
  return true;
}

/** iA Writer ⌥↓ — end of this wrapped line, or end of next wrapped line. */
function cursorEndOfThisOrNextLine(view: EditorView, extend: boolean): boolean {
  const head = view.state.selection.main.head;
  const anchor = view.state.selection.main.anchor;
  const end = visualLineEnd(view, head);
  if (head < end) {
    view.dispatch({
      selection: extend ? EditorSelection.range(anchor, end) : EditorSelection.cursor(end),
      scrollIntoView: true,
    });
    return true;
  }
  if (!cursorLineDown(view)) {
    return false;
  }
  const afterDown = view.state.selection.main.head;
  const nextEnd = visualLineEnd(view, afterDown);
  view.dispatch({
    selection: extend ? EditorSelection.range(anchor, nextEnd) : EditorSelection.cursor(nextEnd),
    scrollIntoView: true,
  });
  return true;
}

function moveToParagraphLine(view: EditorView, delta: -1 | 1, extend: boolean): boolean {
  const head = view.state.selection.main.head;
  const anchor = view.state.selection.main.anchor;
  const newHead = targetPosOnSiblingLine(view.state.doc, head, delta);
  if (newHead == null) {
    return false;
  }
  view.dispatch({
    selection: extend ? EditorSelection.range(anchor, newHead) : EditorSelection.cursor(newHead),
    scrollIntoView: true,
  });
  return true;
}

function moveToSectionBoundary(view: EditorView, which: "start" | "end", extend: boolean): boolean {
  const head = view.state.selection.main.head;
  const anchor = view.state.selection.main.anchor;
  const pos =
    which === "start"
      ? targetSectionStart(view.state.doc, head)
      : targetSectionEnd(view.state.doc, head);
  view.dispatch({
    selection: extend ? EditorSelection.range(anchor, pos) : EditorSelection.cursor(pos),
    scrollIntoView: true,
  });
  return true;
}

/**
 * iA Writer–style markdown navigation:
 * - ↑/↓: wrapped visual line (CodeMirror default)
 * - Ctrl+↑/↓: previous/next paragraph (source line)
 * - Alt+↑/↓: start/end of wrapped line, then previous/next
 * - Cmd+←/→: start/end of source line
 * - Cmd+↑/↓: start/end of current section (headings + scene breaks)
 */
const iaWriterNavigationKeymap = keymap.of([
  { key: "Ctrl-ArrowUp", run: (view) => moveToParagraphLine(view, -1, false) },
  { key: "Ctrl-ArrowDown", run: (view) => moveToParagraphLine(view, 1, false) },
  { key: "Ctrl-Shift-ArrowUp", run: (view) => moveToParagraphLine(view, -1, true) },
  { key: "Ctrl-Shift-ArrowDown", run: (view) => moveToParagraphLine(view, 1, true) },
  { key: "Alt-ArrowUp", run: (view) => cursorStartOfThisOrPreviousLine(view, false) },
  { key: "Alt-ArrowDown", run: (view) => cursorEndOfThisOrNextLine(view, false) },
  { key: "Alt-Shift-ArrowUp", run: (view) => cursorStartOfThisOrPreviousLine(view, true) },
  { key: "Alt-Shift-ArrowDown", run: (view) => cursorEndOfThisOrNextLine(view, true) },
  { key: "Mod-ArrowLeft", run: cursorLineStart, shift: selectLineStart },
  { key: "Mod-ArrowRight", run: cursorLineEnd, shift: selectLineEnd },
  { key: "Mod-ArrowUp", run: (view) => moveToSectionBoundary(view, "start", false) },
  { key: "Mod-ArrowDown", run: (view) => moveToSectionBoundary(view, "end", false) },
  { key: "Mod-Shift-ArrowUp", run: (view) => moveToSectionBoundary(view, "start", true) },
  { key: "Mod-Shift-ArrowDown", run: (view) => moveToSectionBoundary(view, "end", true) },
]);

export const prosaMarkdownNavigationExtensions = [Prec.high(iaWriterNavigationKeymap)];
