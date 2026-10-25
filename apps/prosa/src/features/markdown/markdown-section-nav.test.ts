import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import {
  sectionLineRange,
  targetSectionEnd,
  targetSectionStart,
} from "./markdown-section-nav";

function doc(text: string) {
  return EditorState.create({ doc: text }).doc;
}

describe("sectionLineRange", () => {
  it("treats scene breaks as section boundaries", () => {
    const d = doc("intro\n* * *\nscene two\nline");
    expect(sectionLineRange(d, 1)).toEqual({ startLine: 1, endLine: 1 });
    expect(sectionLineRange(d, 3)).toEqual({ startLine: 3, endLine: 4 });
  });

  it("spans from first line when no break above", () => {
    const d = doc("only\nsection");
    expect(sectionLineRange(d, 2)).toEqual({ startLine: 1, endLine: 2 });
  });
});

describe("targetSectionStart / targetSectionEnd", () => {
  it("jumps within the scene, not the whole document", () => {
    const d = doc("alpha\nbeta\n* * *\ngamma\ndelta");
    const inFirst = d.line(2).from + 1;
    expect(targetSectionStart(d, inFirst)).toBe(d.line(1).from);
    expect(targetSectionEnd(d, inFirst)).toBe(d.line(2).to - 1);

    const inSecond = d.line(4).from;
    expect(targetSectionStart(d, inSecond)).toBe(d.line(4).from);
    expect(targetSectionEnd(d, inSecond)).toBe(d.line(5).to - 1);
  });

  it("uses adjacent scenes when the caret is on a scene break line", () => {
    const d = doc("before\n* * *\nafter");
    const onBreak = d.line(2).from;
    expect(targetSectionStart(d, onBreak)).toBe(d.line(1).from);
    expect(targetSectionEnd(d, onBreak)).toBe(d.line(3).to - 1);
  });
});
