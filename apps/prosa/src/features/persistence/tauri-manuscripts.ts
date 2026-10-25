import { invoke } from "@tauri-apps/api/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import {
  createEmptyProsaDocument,
  deserializeProsaDocument,
  serializeProsaDocument,
} from "@scribo/document-model";

export interface LoadedManuscript {
  summary: ManuscriptSummary;
  document: ProsaDocument;
}

export async function listManuscripts(): Promise<ManuscriptSummary[]> {
  return invoke<ManuscriptSummary[]>("list_manuscripts");
}

export async function createManuscript(title: string): Promise<LoadedManuscript> {
  const document = createEmptyProsaDocument(title);
  const result = await invoke<{ summary: ManuscriptSummary; documentJson: string }>(
    "create_manuscript",
    { title, documentJson: serializeProsaDocument(document) },
  );
  return {
    summary: result.summary,
    document: deserializeProsaDocument(result.documentJson),
  };
}

export async function loadManuscript(id: string): Promise<LoadedManuscript> {
  const result = await invoke<{ summary: ManuscriptSummary; documentJson: string }>(
    "load_manuscript",
    { id },
  );
  return {
    summary: result.summary,
    document: deserializeProsaDocument(result.documentJson),
  };
}

export async function saveManuscript(
  id: string,
  document: ProsaDocument,
): Promise<ManuscriptSummary> {
  return invoke<ManuscriptSummary>("save_manuscript", {
    id,
    documentJson: serializeProsaDocument(document),
  });
}

export async function saveRecoverySnapshot(id: string, document: ProsaDocument): Promise<void> {
  await invoke("save_recovery_snapshot", {
    id,
    documentJson: serializeProsaDocument(document),
  });
}

export async function loadRecoverySnapshot(id: string): Promise<ProsaDocument | null> {
  const json = await invoke<string | null>("load_recovery_snapshot", { id });
  return json ? deserializeProsaDocument(json) : null;
}
