import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import {
  buildMarkdownOutline,
  outlineEntryContainsLine,
  sectionLineRange,
  targetSectionEnd,
  targetSectionStart,
} from "./markdown-sections";

function doc(text: string) {
  return EditorState.create({ doc: text }).doc;
}

describe("sectionLineRange", () => {
  it("treats scene breaks as section boundaries", () => {
    const d = doc("intro\n* * *\nscene two\nline");
    expect(sectionLineRange(d, 1)).toEqual({ startLine: 1, endLine: 1 });
    expect(sectionLineRange(d, 3)).toEqual({ startLine: 3, endLine: 4 });
  });

  it("uses headings as section starts", () => {
    const d = doc("# Title\nbody\n## Sub\nmore");
    expect(sectionLineRange(d, 2)).toEqual({ startLine: 1, endLine: 2 });
    expect(sectionLineRange(d, 4)).toEqual({ startLine: 3, endLine: 4 });
  });

  it("spans from first line when no boundary above", () => {
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

  it("respects heading sections", () => {
    const d = doc("# One\na\n# Two\nb");
    const inOne = d.line(2).from;
    expect(targetSectionStart(d, inOne)).toBe(d.line(1).from);
    expect(targetSectionEnd(d, inOne)).toBe(d.line(2).to - 1);
  });

  it("uses adjacent content when the caret is on a scene break line", () => {
    const d = doc("before\n* * *\nafter");
    const onBreak = d.line(2).from;
    expect(targetSectionStart(d, onBreak)).toBe(d.line(1).from);
    expect(targetSectionEnd(d, onBreak)).toBe(d.line(3).to - 1);
  });
});

describe("buildMarkdownOutline", () => {
  it("lists headings, scene breaks, and passages in order", () => {
    const outline = buildMarkdownOutline("Opening\n* * *\n# Act\nLine");
    expect(outline).toEqual([
      {
        type: "passage",
        line: 1,
        title: "Opening",
        startLine: 1,
        endLine: 1,
      },
      { type: "scene_break", line: 2 },
      {
        type: "heading",
        line: 3,
        level: 1,
        title: "Act",
        startLine: 3,
        endLine: 4,
      },
    ]);
    expect(buildMarkdownOutline("# Only title")).toHaveLength(1);
  });

  it("marks the active outline entry from the caret line", () => {
    const outline = buildMarkdownOutline("# A\nx\n# B\ny");
    const heading = outline[0]!;
    expect(outlineEntryContainsLine(heading, 2)).toBe(true);
    expect(outlineEntryContainsLine(heading, 4)).toBe(false);
  });
});
