import { ScribamError } from "@scribam/core";
import type { ProsaDocument } from "./types";
import { parseProsaDocument } from "./validate";
import { validateProsaDocument } from "./validate";

export function serializeProsaDocument(document: ProsaDocument): string {
  const validated = validateProsaDocument(document);
  try {
    return JSON.stringify(validated, null, 2);
  } catch (cause) {
    throw new ScribamError("serialization_failed", "Failed to serialize Prosa document", {
      cause,
    });
  }
}

export function deserializeProsaDocument(json: string): ProsaDocument {
  return parseProsaDocument(json);
}
