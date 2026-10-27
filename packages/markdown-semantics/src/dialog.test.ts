import { describe, expect, it } from "vitest";
import { dialogQuotedRangesInLine } from "./dialog";

describe("dialogQuotedRangesInLine", () => {
  it("includes contractions inside straight double quotes", () => {
    const line = `"I don't see." Why is that wrong`;
    const ranges = dialogQuotedRangesInLine(line);
    expect(ranges).toHaveLength(1);
    const span = ranges[0]!;
    expect(line.slice(span.from, span.to)).toBe(`"I don't see."`);
  });
});
