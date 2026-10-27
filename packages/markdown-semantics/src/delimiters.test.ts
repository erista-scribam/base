import { describe, expect, it } from "vitest";
import { markupDelimiterRangesInLine } from "./delimiters";

function slice(text: string, ranges: Array<{ from: number; to: number }>): string[] {
  return ranges.map((r) => text.slice(r.from, r.to));
}

describe("markupDelimiterRangesInLine", () => {
  it("marks bold asterisk pairs only", () => {
    const text = "a **bold** word";
    expect(slice(text, markupDelimiterRangesInLine(text))).toEqual(["**", "**"]);
  });

  it("marks italic single asterisks only", () => {
    const text = "a *italic* word";
    expect(slice(text, markupDelimiterRangesInLine(text))).toEqual(["*", "*"]);
  });

  it("marks underline html tags", () => {
    const text = "a <u>line</u> word";
    expect(slice(text, markupDelimiterRangesInLine(text))).toEqual(["<u>", "</u>"]);
  });

  it("skips scene break lines", () => {
    expect(markupDelimiterRangesInLine("* * *")).toEqual([]);
  });

  it("skips list bullet at line start", () => {
    const text = "* list item";
    expect(slice(text, markupDelimiterRangesInLine(text))).toEqual([]);
  });
});
