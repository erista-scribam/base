import { describe, expect, it } from "vitest";
import { createEmptyProsaDocument } from "@scribo/document-model";
import { markdownToProsaDocument, prosaDocumentToMarkdown } from "./prosa-markdown";

describe("prosa-markdown", () => {
  it("round-trips headings, paragraphs, and ordered lists", () => {
    const base = createEmptyProsaDocument("Test");
    const md = `# Bleh
Have you known peop
1. Meh
2. Bleh
3. Dawg
## Bleh
Meh`;

    const doc = markdownToProsaDocument(base, md);
    expect(doc.blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "heading",
      "paragraph",
    ]);

    const again = markdownToProsaDocument(base, prosaDocumentToMarkdown(doc));
    expect(again.blocks.map((block) => block.type)).toEqual(doc.blocks.map((block) => block.type));
  });

  it("never throws on typical manuscript markdown", () => {
    const base = createEmptyProsaDocument("Test");
    expect(() =>
      markdownToProsaDocument(base, "# Title\n\n1. one\n2. two\n* bullet"),
    ).not.toThrow();
  });

  it("does not treat scene breaks as bullet lists", () => {
    const base = createEmptyProsaDocument("Test");
    const doc = markdownToProsaDocument(base, "Before\n* * *\nAfter");
    expect(doc.blocks.map((block) => block.type)).toEqual([
      "paragraph",
      "scene_break",
      "paragraph",
    ]);
  });
});
