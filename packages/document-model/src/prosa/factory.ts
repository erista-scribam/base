import { createDocumentId } from "@scribo/core";
import type { ProsaDocument } from "./types";
import { PROSA_SCHEMA_VERSION } from "./version";

function blockId(): string {
  return `blk_${crypto.randomUUID()}`;
}

export function createEmptyProsaDocument(title = "Untitled"): ProsaDocument {
  return {
    schemaVersion: PROSA_SCHEMA_VERSION,
    id: createDocumentId(),
    title,
    blocks: [
      {
        type: "paragraph",
        id: blockId(),
        content: [{ type: "text", id: `inl_${crypto.randomUUID()}`, text: "" }],
      },
    ],
  };
}
