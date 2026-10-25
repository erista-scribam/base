import { serializeProsaDocument, type ProsaDocument } from "@scribo/document-model";

/** Stable fingerprint for comparing document revisions in memory. */
export function documentRevisionFingerprint(document: ProsaDocument): string {
  return serializeProsaDocument(document);
}

export function documentsEqual(a: ProsaDocument, b: ProsaDocument): boolean {
  return documentRevisionFingerprint(a) === documentRevisionFingerprint(b);
}
