import { describe, expect, it } from "vitest";
import { normalizeMarkdownSource } from "./markdown-normalize";

describe("normalizeMarkdownSource", () => {
  it("trims trailing whitespace and collapses extra blank lines", () => {
    const input = "Hello   \n\n\n\nWorld  \n";
    expect(normalizeMarkdownSource(input)).toBe("Hello\n\nWorld\n");
  });

  it("adds trailing newline for non-empty docs", () => {
    expect(normalizeMarkdownSource("one line")).toBe("one line\n");
  });
});
