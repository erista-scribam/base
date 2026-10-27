import { describe, expect, it } from "vitest";
import { dialogQuotedRangesInLine } from "./markdown-inline-semantics";

describe("dialogQuotedRangesInLine", () => {
  it("includes contractions inside straight double quotes", () => {
    const line = `"I don't see." Why is that wrong`;
    const ranges = dialogQuotedRangesInLine(line);
    expect(ranges).toHaveLength(1);
    const span = ranges[0];
    expect(span).toBeDefined();
    expect(line.slice(span!.from, span!.to)).toBe(`"I don't see."`);
  });

  it("matches typographic double quotes", () => {
    const line = `\u201cHello there.\u201d`;
    const ranges = dialogQuotedRangesInLine(line);
    const span = ranges[0];
    expect(span).toBeDefined();
    expect(line.slice(span!.from, span!.to)).toBe(line);
  });
});
