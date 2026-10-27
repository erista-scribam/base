import { describe, expect, it } from "vitest";
import { lineSemanticDecorationRanges } from "./markdown-inline-semantics";

describe("lineSemanticDecorationRanges order", () => {
  it("returns ascending from offsets (underline + delimiters)", () => {
    const text = "a <u>x</u> **b**";
    const ranges = lineSemanticDecorationRanges(text, 100);
    const froms = ranges.map((r) => r.from);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
    expect(ranges.some((r) => r.classes.includes("cm-md-tok-dialog"))).toBe(false);
    expect(ranges.some((r) => r.classes.includes("cm-md-tok-delimiter"))).toBe(true);
  });

  it("includes dialog decoration class", () => {
    const text = 'She said "Hello."';
    const ranges = lineSemanticDecorationRanges(text, 0);
    expect(ranges.some((r) => r.classes.includes("cm-md-tok-dialog"))).toBe(true);
  });
});
