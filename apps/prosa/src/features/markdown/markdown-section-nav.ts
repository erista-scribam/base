import type { Text } from "@codemirror/state";
import { isSceneBreakLineRaw } from "./markdown-source-layout";

function isSectionBoundary(doc: Text, lineNumber: number): boolean {
  return isSceneBreakLineRaw(doc.line(lineNumber).text);
}

/** Content between scene breaks (page-break equivalents), boundaries excluded. */
export function sectionLineRange(
  doc: Text,
  lineNumber: number,
): { startLine: number; endLine: number } {
  let startLine = 1;
  for (let line = lineNumber - 1; line >= 1; line -= 1) {
    if (isSectionBoundary(doc, line)) {
      startLine = line + 1;
      break;
    }
  }

  let endLine = doc.lines;
  for (let line = lineNumber + 1; line <= doc.lines; line += 1) {
    if (isSectionBoundary(doc, line)) {
      endLine = line - 1;
      break;
    }
  }

  if (startLine > endLine) {
    return { startLine: lineNumber, endLine: lineNumber };
  }
  return { startLine, endLine };
}

function referenceContentLine(doc: Text, lineNumber: number, prefer: "above" | "below"): number {
  if (!isSectionBoundary(doc, lineNumber)) {
    return lineNumber;
  }
  if (prefer === "above") {
    for (let line = lineNumber - 1; line >= 1; line -= 1) {
      if (!isSectionBoundary(doc, line)) {
        return line;
      }
    }
    for (let line = lineNumber + 1; line <= doc.lines; line += 1) {
      if (!isSectionBoundary(doc, line)) {
        return line;
      }
    }
    return lineNumber;
  }
  for (let line = lineNumber + 1; line <= doc.lines; line += 1) {
    if (!isSectionBoundary(doc, line)) {
      return line;
    }
  }
  for (let line = lineNumber - 1; line >= 1; line -= 1) {
    if (!isSectionBoundary(doc, line)) {
      return line;
    }
  }
  return lineNumber;
}

function endOfLinePos(doc: Text, lineNumber: number): number {
  const line = doc.line(lineNumber);
  return line.length > 0 ? line.to - 1 : line.from;
}

/** Caret position at the start of the current scene (between scene breaks). */
export function targetSectionStart(doc: Text, head: number): number {
  const line = doc.lineAt(head);
  const ref = referenceContentLine(doc, line.number, "above");
  const { startLine } = sectionLineRange(doc, ref);
  return doc.line(startLine).from;
}

/** Caret position at the end of the current scene (between scene breaks). */
export function targetSectionEnd(doc: Text, head: number): number {
  const line = doc.lineAt(head);
  const ref = referenceContentLine(doc, line.number, "below");
  const { endLine } = sectionLineRange(doc, ref);
  return endOfLinePos(doc, endLine);
}
