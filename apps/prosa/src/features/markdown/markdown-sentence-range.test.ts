import { describe, expect, it } from "vitest";
import { sentenceRangeAt } from "./markdown-sentence-range";

function range(text: string, offset: number): string {
  const { from, to } = sentenceRangeAt(text, offset);
  return text.slice(from, to);
}

describe("sentenceRangeAt", () => {
  it("does not split on apostrophes in contractions", () => {
    const line = `"I don't see." Why is that wrong`;
    expect(range(line, line.indexOf("don"))).toBe(`"I don't see."`);
  });

  it("starts the next sentence after closing quote following a period", () => {
    const line = `"I don't see." Why is that wrong`;
    expect(range(line, line.indexOf("Why"))).toBe("Why is that wrong");
  });

  it("includes terminal punctuation in the active sentence", () => {
    expect(range("Hello there.", 3)).toBe("Hello there.");
  });
});
