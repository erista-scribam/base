import type { Text } from "@codemirror/state";

/** Next/previous document line at the same column (markdown: one file line = one block). */
export function targetPosOnSiblingLine(doc: Text, head: number, delta: -1 | 1): number | null {
  const line = doc.lineAt(head);
  const targetNumber = line.number + delta;
  if (targetNumber < 1 || targetNumber > doc.lines) {
    return null;
  }
  const target = doc.line(targetNumber);
  const col = head - line.from;
  return target.from + Math.min(col, target.length);
}
