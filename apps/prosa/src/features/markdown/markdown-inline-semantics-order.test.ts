import { buildLineSemanticSpansAt, MARKDOWN_SEMANTIC_CM_CLASS } from "@scribam/markdown-semantics";
import { describe, expect, it } from "vitest";

describe("buildLineSemanticSpansAt (CodeMirror order)", () => {
  it("returns ascending doc offsets", () => {
    const text = "a <u>x</u> **b**";
    const spans = buildLineSemanticSpansAt(text, 100);
    const froms = spans.map((s) => s.docFrom);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
  });

  it("uses stable dialog CM class constant", () => {
    expect(MARKDOWN_SEMANTIC_CM_CLASS.dialog).toBe("cm-md-tok-dialog");
  });
});
