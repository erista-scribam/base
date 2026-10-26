import { EditorSelection, type EditorState, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { lineMarkerMeta } from "./codemirror-markdown-layout";

export type MarkdownFormatAction =
  "bold" | "italic" | "heading1" | "heading2" | "heading3" | "paragraph" | "quote" | "bulletList";

function wrapInline(state: EditorState, left: string, right: string): TransactionSpec | null {
  const range = state.selection.main;
  if (range.empty) {
    return null;
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

function setHeadingLevel(
  lineText: string,
  headOffset: number,
  level: number,
): { text: string; cursorOffset: number } {
  const stripped = lineText.replace(/^#{1,6}\s+/, "");
  const prefix = "#".repeat(level) + " ";
  const text = prefix + stripped;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, prefix.length + bodyOffset) };
}

function setParagraphLine(
  lineText: string,
  headOffset: number,
): { text: string; cursorOffset: number } {
  const meta = lineMarkerMeta(lineText);
  let stripped = lineText;
  if (meta.kind === "heading") {
    stripped = lineText.replace(/^#{1,6}\s+/, "");
  } else if (meta.kind === "quote") {
    stripped = lineText.replace(/^>\s?/, "");
  } else if (meta.kind === "list") {
    stripped = lineText.replace(/^(\d+\.\s+\[[ xX]\]\s|[-*+]\s+\[[ xX]\]\s|\d+\.\s|[-*+]\s)/, "");
  }
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
  const withoutHeading = lineText.replace(/^#{1,6}\s+/, "");
  const text = `> ${withoutHeading}`;
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
  const body = lineText.replace(/^#{1,6}\s+/, "").replace(/^>\s?/, "");
  const text = `- ${body}`;
  const bodyOffset = Math.max(0, headOffset - prefixDelta(lineText));
  return { text, cursorOffset: Math.min(text.length, 2 + bodyOffset) };
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
    case "heading1":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 1));
      break;
    case "heading2":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 2));
      break;
    case "heading3":
      spec = replaceLinePrefix(state, (line, head) => setHeadingLevel(line, head, 3));
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
