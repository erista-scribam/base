import { tryValidateProsaDocument, type ProsaDocument } from "@scribam/document-model";
import { manuscriptContentEqual } from "./document-revision";

export interface RecoveryCandidate {
  document: ProsaDocument;
  capturedAt: string;
}

export type RecoveryDecision =
  | { kind: "use_saved"; document: ProsaDocument }
  | { kind: "use_recovery"; document: ProsaDocument; reason: "newer_recovery" }
  | { kind: "use_saved"; document: ProsaDocument; reason: "invalid_recovery" }
  | { kind: "use_saved"; document: ProsaDocument; reason: "recovery_older" };

function parseTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function resolveRecoveryOnOpen(
  saved: ProsaDocument,
  savedUpdatedAt: string,
  recovery: RecoveryCandidate | null,
): RecoveryDecision {
  if (!recovery) {
    return { kind: "use_saved", document: saved };
  }

  const validated = tryValidateProsaDocument(recovery.document);
  if (!validated.success) {
    return { kind: "use_saved", document: saved, reason: "invalid_recovery" };
  }

  const recoveryDoc = validated.data;
  if (manuscriptContentEqual(saved, recoveryDoc)) {
    return { kind: "use_saved", document: saved };
  }

  if (parseTimestamp(recovery.capturedAt) <= parseTimestamp(savedUpdatedAt)) {
    return { kind: "use_saved", document: saved, reason: "recovery_older" };
  }

  return { kind: "use_recovery", document: recoveryDoc, reason: "newer_recovery" };
}
