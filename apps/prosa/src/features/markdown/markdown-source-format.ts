import { EditorSelection, type EditorState, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { lineMarkerMeta } from "./codemirror-markdown-layout";
import { isSceneBreakLineRaw } from "./markdown-source-layout";

export type MarkdownFormatAction =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "paragraph"
  | "quote"
  | "bulletList"
  | "numberedList"
  | "taskList"
  | "codeBlock"
  | "sceneBreak";

function wrapInline(state: EditorState, left: string, right: string): TransactionSpec | null {
  const range = state.selection.main;
  if (range.empty) {
    const wrapped = `${left}${right}`;
    return {
      changes: { from: range.from, to: range.to, insert: wrapped },
      selection: EditorSelection.cursor(range.from + left.length),
    };
  }
  const selected = state.sliceDoc(range.from, range.to);
  if (
    selected.startsWith(left) &&
    selected.endsWith(right) &&
    selected.length >= left.length + right.length
  ) {
    const inner = selected.slice(left.length, selected.length - right.length);
    return {
      changes: { from: range.from, to: range.to, insert: inner },
      selection: EditorSelection.range(range.from, range.from + inner.length),
    };
  }
  const wrapped = `${left}${selected}${right}`;
  return {
    changes: { from: range.from, to: range.to, insert: wrapped },
    selection: EditorSelection.range(
      range.from + left.length,
      range.from + left.length + selected.length,
    ),
  };
}

function replaceLinePrefix(
  state: EditorState,
  transform: (lineText: string, headOffsetInLine: number) => { text: string; cursorOffset: number },
): TransactionSpec | null {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  const headOffset = head - line.from;
  const { text, cursorOffset } = transform(line.text, headOffset);
  if (text === line.text) {
    return null;
  }
  return {
    changes: { from: line.from, to: line.to, insert: text },
    selection: EditorSelection.cursor(line.from + cursorOffset),
  };
}

function prefixDelta(lineText: string): number {
  const meta = lineMarkerMeta(lineText);
  if (meta.kind === "heading" || meta.kind === "quote" || meta.kind === "list") {
    return meta.markerCh;
  }
  return 0;
}

function stripLinePrefix(lineText: string): string {
  const meta = lineMarkerMeta(lineText);
  if (meta.kind === "heading") {
    return lineText.replace(/^#{1,6}\s+/, "");
  }
  if (meta.kind === "quote") {
    return lineText.replace(/^>\s?/, "");
  }
  if (meta.kind === "list") {
    return lineText.replace(/^(\d+\.\s+\[[ xX]\]\s|[-*+]\s+\[[ xX]\]\s|\d+\.\s|[-*+]\s)/, "");
  }
  return lineText;
}

function setHeadingLevel(
  lineText: string,
  headOffset: number,
  level: number,
): { text: string; cursorOffset: number } {
  const stripped = stripLinePrefix(lineText);
  const prefix = "#".repeat(level) + " ";
  const text = prefix + stripped;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, prefix.length + bodyOffset) };
}

function setParagraphLine(
  lineText: string,
  headOffset: number,
): { text: string; cursorOffset: number } {
  const stripped = stripLinePrefix(lineText);
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text: stripped, cursorOffset: Math.min(stripped.length, bodyOffset) };
}

function toggleQuote(lineText: string, headOffset: number): { text: string; cursorOffset: number } {
  const meta = lineMarkerMeta(lineText);
  if (meta.kind === "quote") {
    const stripped = lineText.replace(/^>\s?/, "");
    const bodyOffset = Math.max(0, headOffset - meta.markerCh);
    return { text: stripped, cursorOffset: Math.min(stripped.length, bodyOffset) };
  }
  const withoutPrefix = stripLinePrefix(lineText);
  const text = `> ${withoutPrefix}`;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, 2 + bodyOffset) };
}

function toggleBullet(
  lineText: string,
  headOffset: number,
): { text: string; cursorOffset: number } {
  const meta = lineMarkerMeta(lineText);
  if (meta.kind === "list" && /^[-*+]\s/.test(lineText)) {
    const stripped = lineText.replace(/^[-*+]\s+/, "");
    const bodyOffset = Math.max(0, headOffset - meta.markerCh);
    return { text: stripped, cursorOffset: Math.min(stripped.length, bodyOffset) };
  }
  const body = stripLinePrefix(lineText);
  const text = `- ${body}`;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, 2 + bodyOffset) };
}

function toggleOrdered(
  lineText: string,
  headOffset: number,
): { text: string; cursorOffset: number } {
  const meta = lineMarkerMeta(lineText);
  if (meta.kind === "list" && /^\d+\.\s/.test(lineText) && !/^\d+\.\s+\[/.test(lineText)) {
    const stripped = lineText.replace(/^\d+\.\s+/, "");
    const bodyOffset = Math.max(0, headOffset - meta.markerCh);
    return { text: stripped, cursorOffset: Math.min(stripped.length, bodyOffset) };
  }
  const body = stripLinePrefix(lineText);
  const text = `1. ${body}`;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, 3 + bodyOffset) };
}

function toggleTask(lineText: string, headOffset: number): { text: string; cursorOffset: number } {
  const meta = lineMarkerMeta(lineText);
  if (meta.kind === "list" && /^[-*+]\s+\[[ xX]\]\s/.test(lineText)) {
    const stripped = lineText.replace(/^[-*+]\s+\[[ xX]\]\s+/, "");
    const bodyOffset = Math.max(0, headOffset - meta.markerCh);
    return { text: stripped, cursorOffset: Math.min(stripped.length, bodyOffset) };
  }
  const body = stripLinePrefix(lineText);
  const text = `- [ ] ${body}`;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, 6 + bodyOffset) };
}

function toggleCodeBlock(lineText: string): { text: string; cursorOffset: number } {
  const trimmed = lineText.trimStart();
  if (trimmed.startsWith("```")) {
    const text = stripLinePrefix(lineText);
    return { text, cursorOffset: text.length };
  }
  const text = "```";
  return { text, cursorOffset: 3 };
}

function setSceneBreak(): { text: string; cursorOffset: number } {
  return { text: "* * *", cursorOffset: 5 };
}

export function applyMarkdownFormat(view: EditorView, action: MarkdownFormatAction): boolean {
  let spec: TransactionSpec | null = null;
  const state = view.state;

  switch (action) {
    case "bold":
      spec = wrapInline(state, "**", "**");
      break;
    case "italic":
      spec = wrapInline(state, "*", "*");
      break;
    case "strike":
      spec = wrapInline(state, "~~", "~~");
      break;
    case "code":
      spec = wrapInline(state, "`", "`");
      break;
    case "heading1":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 1));
      break;
    case "heading2":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 2));
      break;
    case "heading3":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 3));
      break;
    case "heading4":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 4));
      break;
    case "heading5":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 5));
      break;
    case "paragraph":
      spec = replaceLinePrefix(state, (line, head) => setParagraphLine(line, head));
      break;
    case "quote":
      spec = replaceLinePrefix(state, (line, head) => toggleQuote(line, head));
      break;
    case "bulletList":
      spec = replaceLinePrefix(state, (line, head) => toggleBullet(line, head));
      break;
    case "numberedList":
      spec = replaceLinePrefix(state, (line, head) => toggleOrdered(line, head));
      break;
    case "taskList":
      spec = replaceLinePrefix(state, (line, head) => toggleTask(line, head));
      break;
    case "codeBlock":
      spec = replaceLinePrefix(state, (line) => toggleCodeBlock(line));
      break;
    case "sceneBreak":
      spec = replaceLinePrefix(state, (line) => {
        if (isSceneBreakLineRaw(line.trim())) {
          return setParagraphLine(line, 0);
        }
        return setSceneBreak();
      });
      break;
    default:
      return false;
  }

  if (!spec) {
    return false;
  }
  view.dispatch(spec);
  view.focus();
  return true;
}
