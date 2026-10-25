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

  it("requires href when link mark is present", () => {
    expect(() =>
      validateProsaDocument({
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
      }),
    ).toThrow();
  });

  it("round-trips through JSON serialization", () => {
    const doc = createEmptyProsaDocument();
    doc.blocks.push({ type: "scene_break", id: "blk_scene" });
    const json = serializeProsaDocument(doc);
    const restored = parseProsaDocument(json);
    expect(restored).toEqual(doc);
  });
});
