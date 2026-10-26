import { serializeProsaDocument, type ProsaDocument } from "@scribam/document-model";
import { prosaDocumentToMarkdown } from "../markdown/prosa-markdown";

/** Stable fingerprint for comparing document revisions in memory. */
export function documentRevisionFingerprint(document: ProsaDocument): string {
  return serializeProsaDocument(document);
}

export function documentsEqual(a: ProsaDocument, b: ProsaDocument): boolean {
  return documentRevisionFingerprint(a) === documentRevisionFingerprint(b);
}

/** Same prose for the user (e.g. markdown on disk vs JSON recovery snapshot). */
export function manuscriptContentEqual(a: ProsaDocument, b: ProsaDocument): boolean {
  if (documentsEqual(a, b)) {
    return true;
  }
  try {
    return prosaDocumentToMarkdown(a) === prosaDocumentToMarkdown(b);
  } catch {
    return false;
  }
}

export function diskRevisionIsNewer(candidate: string, baseline: string): boolean {
  const candidateMs = Date.parse(candidate);
  const baselineMs = Date.parse(baseline);
  if (Number.isNaN(candidateMs) || Number.isNaN(baselineMs)) {
    return candidate > baseline;
  }
  return candidateMs > baselineMs;
}
