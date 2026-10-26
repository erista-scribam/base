import { describe, expect, it } from "vitest";
import { createEmptyProsaDocument } from "@scribam/document-model";
import {
  markdownToProsaDocument,
  prosaDocumentToAuthorMarkdown,
  prosaDocumentToMarkdown,
} from "./prosa-markdown";

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

  it("applies parsed markdown even when a block fails strict validation", () => {
    const base = createEmptyProsaDocument("Test");
    const doc = markdownToProsaDocument(base, "# Title\n\n[bad link]()\n\nStill here");
    expect(doc.blocks.some((block) => block.type === "heading")).toBe(true);
    expect(
      doc.blocks.some(
        (block) =>
          block.type === "paragraph" &&
          block.content.some((node) => node.text.includes("Still here")),
      ),
    ).toBe(true);
  });

  it("treats each body line as its own paragraph", () => {
    const base = createEmptyProsaDocument("Test");
    const doc = markdownToProsaDocument(base, "First line\nSecond line\nThird");
    expect(doc.blocks.filter((block) => block.type === "paragraph")).toHaveLength(3);
  });

  it("preserves prose after ordered lists when exporting markdown", () => {
    const base = createEmptyProsaDocument("Test");
    const md = "Intro line\n1. one\n2. two\nAfter the list\nStill here";
    const doc = markdownToProsaDocument(base, md);
    const exported = prosaDocumentToMarkdown(doc);
    const roundTrip = markdownToProsaDocument(base, exported);
    expect(roundTrip.blocks.map((block) => block.type)).toEqual([
      "paragraph",
      "list",
      "paragraph",
      "paragraph",
    ]);
    expect(roundTrip.blocks.map((block) => block.id)).toEqual(doc.blocks.map((block) => block.id));
  });

  it("hides block id comments in author markdown but keeps them on disk export", () => {
    const base = createEmptyProsaDocument("Test");
    const md = `<!-- scribam:block=blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee -->
# Title

Body line`;
    const doc = markdownToProsaDocument(base, md);
    const author = prosaDocumentToAuthorMarkdown(doc);
    expect(author).not.toContain("scribam:block");
    expect(author).toContain("# Title");
    expect(prosaDocumentToMarkdown(doc)).toContain("blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    const roundTrip = markdownToProsaDocument(doc, author);
    expect(roundTrip.blocks.map((block) => block.id)).toEqual(doc.blocks.map((block) => block.id));
  });

  it("preserves block ids from scribam markdown comments", () => {
    const base = createEmptyProsaDocument("Test");
    const md = `<!-- scribam:block=blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee -->
# Title

<!-- scribam:block=blk_bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee -->
Body`;
    const doc = markdownToProsaDocument(base, md);
    expect(doc.blocks[0]?.id).toBe("blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(doc.blocks[1]?.id).toBe("blk_bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(prosaDocumentToMarkdown(doc)).toContain("blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
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
