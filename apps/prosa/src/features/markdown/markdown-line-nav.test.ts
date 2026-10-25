import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { targetPosOnSiblingLine } from "./markdown-line-nav";

function doc(text: string) {
  return EditorState.create({ doc: text }).doc;
}

describe("targetPosOnSiblingLine", () => {
  it("moves up one document line at the same column", () => {
    const text = "line one\nline two\n1. Meh";
    const d = doc(text);
    const mehLine = d.line(3);
    const head = mehLine.from + 2;
    const next = targetPosOnSiblingLine(d, head, -1);
    expect(next).toBe(d.line(2).from + 2);
    expect(d.sliceString(next!, next! + 4)).toBe("ne t");
  });

  it("steps through list lines one at a time", () => {
    const text = "para before\n1. Meh\n2. Bleh";
    const d = doc(text);
    let head = d.line(2).from;
    head = targetPosOnSiblingLine(d, head, -1)!;
    expect(d.lineAt(head).text).toBe("para before");
    head = targetPosOnSiblingLine(d, head, 1)!;
    expect(d.lineAt(head).text).toBe("1. Meh");
  });

  it("clamps column on shorter lines", () => {
    const d = doc("short\n1. Meh");
    const head = d.line(2).from + 5;
    const up = targetPosOnSiblingLine(d, head, -1)!;
    expect(up).toBe(d.line(1).to);
  });
});
