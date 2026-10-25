import { describe, expect, it } from "vitest";
import { createDocumentId } from "@scribo/core";
import { PROSA_SCHEMA_VERSION } from "./version";
import { createEmptyProsaDocument } from "./factory";
import { parseProsaDocument, validateProsaDocument } from "./validate";
import { serializeProsaDocument } from "./serialize";

describe("Prosa document model", () => {
  it("accepts a minimal valid document", () => {
    const doc = createEmptyProsaDocument("Chapter One");
    expect(validateProsaDocument(doc)).toEqual(doc);
  });

  it("rejects headings encoded as styled paragraphs", () => {
    expect(() =>
      validateProsaDocument({
        schemaVersion: PROSA_SCHEMA_VERSION,
        id: createDocumentId(),
        title: "Bad",
        blocks: [{ type: "paragraph", id: "blk_1", content: [], style: "heading1" }],
      }),
    ).toThrow();
  });

  it("repairs link marks that are missing href", () => {
    const doc = validateProsaDocument({
      schemaVersion: PROSA_SCHEMA_VERSION,
      id: createDocumentId(),
      title: "Links",
      blocks: [
        {
          type: "paragraph",
          id: "blk_1",
          content: [
            {
              type: "text",
              id: "inl_1",
              text: "read more",
              marks: ["link"],
            },
          ],
        },
      ],
    });
    expect(doc.blocks[0]?.type).toBe("paragraph");
    if (doc.blocks[0]?.type === "paragraph") {
      expect(doc.blocks[0].content[0]?.marks).toBeUndefined();
    }
  });

  it("repairs list blocks missing ordered flag", () => {
    const doc = validateProsaDocument({
      schemaVersion: PROSA_SCHEMA_VERSION,
      id: createDocumentId(),
      title: "Lists",
      blocks: [
        {
          type: "list",
          id: "blk_list",
          items: [{ id: "item_1", content: [{ type: "text", id: "inl_1", text: "One" }] }],
        },
      ],
    });
    expect(doc.blocks[0]?.type).toBe("list");
    if (doc.blocks[0]?.type === "list") {
      expect(doc.blocks[0].ordered).toBe(true);
    }
  });

  it("accepts ordered and bullet lists", () => {
    const doc = validateProsaDocument({
      schemaVersion: PROSA_SCHEMA_VERSION,
      id: createDocumentId(),
      title: "Lists",
      blocks: [
        {
          type: "list",
          id: "blk_list",
          ordered: true,
          items: [
            { id: "item_1", content: [{ type: "text", id: "inl_1", text: "One" }] },
            { id: "item_2", content: [{ type: "text", id: "inl_2", text: "Two" }] },
          ],
        },
      ],
    });
    expect(doc.blocks[0]?.type).toBe("list");
  });

  it("round-trips through JSON serialization", () => {
    const doc = createEmptyProsaDocument();
    doc.blocks.push({ type: "scene_break", id: "blk_scene" });
    const json = serializeProsaDocument(doc);
    const restored = parseProsaDocument(json);
    expect(restored).toEqual(doc);
  });
});
