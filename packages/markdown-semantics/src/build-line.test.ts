import { describe, expect, it } from "vitest";
import { buildLineSemanticSpans } from "./build-line";
import { MARKDOWN_SEMANTIC_CM_CLASS } from "./kinds";

function slice(text: string, spans: ReturnType<typeof buildLineSemanticSpans>): string[] {
  return spans.map((s) => text.slice(s.from, s.to));
}

describe("buildLineSemanticSpans", () => {
  it("orders spans for underline + delimiters (CodeMirror-safe)", () => {
    const text = "a <u>x</u> **b**";
    const spans = buildLineSemanticSpans(text);
    const froms = spans.map((s) => s.from);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
    expect(spans.some((s) => s.kind === "delimiter")).toBe(true);
    expect(spans.some((s) => s.kind === "underline")).toBe(true);
  });

  it("includes dialog span", () => {
    const text = 'She said "Hello."';
    const spans = buildLineSemanticSpans(text);
    expect(spans.filter((s) => s.kind === "dialog")).toHaveLength(1);
    expect(
      slice(
        text,
        spans.filter((s) => s.kind === "dialog"),
      ),
    ).toEqual(['"Hello."']);
  });

  it("does not delimiter-inside dialog", () => {
    const text = '"**not markup**"';
    const spans = buildLineSemanticSpans(text);
    expect(spans.every((s) => s.kind === "dialog")).toBe(true);
  });

  it("maps kinds to stable CM classes", () => {
    expect(MARKDOWN_SEMANTIC_CM_CLASS.dialog).toBe("cm-md-tok-dialog");
  });
});
