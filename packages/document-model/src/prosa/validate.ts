import { ValidationError } from "@scribo/core";
import type { ProsaDocument } from "./types";
import { prosaDocumentSchema } from "./schema";
import { repairProsaDocumentInput } from "./repair";

export function tryValidateProsaDocument(input: unknown) {
  return prosaDocumentSchema.safeParse(repairProsaDocumentInput(input));
}

export function validateProsaDocument(input: unknown): ProsaDocument {
  const result = tryValidateProsaDocument(input);
  if (!result.success) {
    throw new ValidationError("Prosa document validation failed", result.error.flatten());
  }
  return result.data;
}

export function parseProsaDocument(json: string): ProsaDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch (cause) {
    throw new ValidationError("Prosa document is not valid JSON", { cause });
  }
  return validateProsaDocument(parsed);
}
