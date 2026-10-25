import type { Text } from "@codemirror/state";
import { isSceneBreakLineRaw } from "./markdown-source-layout";

export function parseMarkdownHeadingLine(
  line: string,
): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null {
  const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    level: match[1].length as 1 | 2 | 3 | 4 | 5 | 6,
    text: match[2].trim(),
  };
}

export type LineBoundary =
  { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; title: string } | { kind: "scene" };

export function lineBoundaryForText(text: string): LineBoundary | null {
  if (isSceneBreakLineRaw(text)) {
    return { kind: "scene" };
  }
  const heading = parseMarkdownHeadingLine(text);
  if (heading) {
    return { kind: "heading", level: heading.level, title: heading.text };
  }
  return null;
}

function lineBoundary(doc: Text, lineNumber: number): LineBoundary | null {
  return lineBoundaryForText(doc.line(lineNumber).text);
}

function isBoundaryLine(doc: Text, lineNumber: number): boolean {
  return lineBoundary(doc, lineNumber) != null;
}

/** Navigable range: headings open a block; scene breaks split prose between them. */
export function sectionLineRange(
  doc: Text,
  lineNumber: number,
): { startLine: number; endLine: number } {
  const onBoundary = lineBoundary(doc, lineNumber);
  if (onBoundary?.kind === "heading") {
    return { startLine: lineNumber, endLine: endLineBeforeNextBoundary(doc, lineNumber) };
  }

  let startLine = 1;
  for (let line = lineNumber - 1; line >= 1; line -= 1) {
    const boundary = lineBoundary(doc, line);
    if (boundary?.kind === "scene") {
      startLine = line + 1;
      break;
    }
    if (boundary?.kind === "heading") {
      startLine = line;
      break;
    }
  }

  const endLine = endLineBeforeNextBoundary(doc, lineNumber);
  return { startLine, endLine: Math.max(startLine, endLine) };
}

function endLineBeforeNextBoundary(doc: Text, fromLine: number): number {
  for (let line = fromLine + 1; line <= doc.lines; line += 1) {
    if (isBoundaryLine(doc, line)) {
      return line - 1;
    }
  }
  return doc.lines;
}

function referenceContentLine(doc: Text, lineNumber: number, prefer: "above" | "below"): number {
  if (!isBoundaryLine(doc, lineNumber)) {
    return lineNumber;
  }
  const order = prefer === "above" ? [-1, 1] : [1, -1];
  for (const delta of order) {
    for (let line = lineNumber + delta; delta < 0 ? line >= 1 : line <= doc.lines; line += delta) {
      if (!isBoundaryLine(doc, line)) {
        return line;
      }
    }
  }
  return lineNumber;
}

function endOfLinePos(doc: Text, lineNumber: number): number {
  const line = doc.line(lineNumber);
  return line.length > 0 ? line.to - 1 : line.from;
}

export function targetSectionStart(doc: Text, head: number): number {
  const line = doc.lineAt(head);
  const ref = referenceContentLine(doc, line.number, "above");
  const { startLine } = sectionLineRange(doc, ref);
  return doc.line(startLine).from;
}

export function targetSectionEnd(doc: Text, head: number): number {
  const line = doc.lineAt(head);
  const ref = referenceContentLine(doc, line.number, "below");
  const { endLine } = sectionLineRange(doc, ref);
  return endOfLinePos(doc, endLine);
}

export type MarkdownOutlineEntry =
  | {
      type: "heading";
      line: number;
      level: number;
      title: string;
      startLine: number;
      endLine: number;
    }
  | { type: "scene_break"; line: number }
  | {
      type: "passage";
      line: number;
      title: string;
      startLine: number;
      endLine: number;
    };

function passageTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "Untitled passage";
  }
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

function sectionEndLine(lines: string[], fromLine: number): number {
  for (let line = fromLine + 1; line <= lines.length; line += 1) {
    if (lineBoundaryForText(lines[line - 1] ?? "")) {
      return line - 1;
    }
  }
  return lines.length;
}

/** Document outline: headings, scene breaks, and untitled passages between breaks. */
export function buildMarkdownOutline(source: string): MarkdownOutlineEntry[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const entries: MarkdownOutlineEntry[] = [];
  let line = 1;
  while (line <= lines.length) {
    const text = lines[line - 1] ?? "";
    const boundary = lineBoundaryForText(text);
    if (boundary?.kind === "heading") {
      const endLine = sectionEndLine(lines, line);
      entries.push({
        type: "heading",
        line,
        level: boundary.level,
        title: boundary.title,
        startLine: line,
        endLine,
      });
      line = endLine + 1;
      continue;
    }
    if (boundary?.kind === "scene") {
      entries.push({ type: "scene_break", line });
      line += 1;
      continue;
    }
    const startLine = line;
    while (line <= lines.length && !lineBoundaryForText(lines[line - 1] ?? "")) {
      line += 1;
    }
    entries.push({
      type: "passage",
      line: startLine,
      title: passageTitle(lines[startLine - 1] ?? ""),
      startLine,
      endLine: line - 1,
    });
  }
  return entries;
}

export function outlineEntryContainsLine(entry: MarkdownOutlineEntry, lineNumber: number): boolean {
  if (entry.type === "scene_break") {
    return entry.line === lineNumber;
  }
  return lineNumber >= entry.startLine && lineNumber <= entry.endLine;
}
