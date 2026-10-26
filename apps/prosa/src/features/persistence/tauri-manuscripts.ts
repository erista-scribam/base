import { invoke } from "@tauri-apps/api/core";
import type { ManuscriptSummary, ScriboProjectManifest } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import {
  createEmptyProsaDocument,
  deserializeProsaDocument,
  serializeProsaDocument,
  tryValidateProsaDocument,
} from "@scribo/document-model";
import { markdownToProsaDocument, prosaDocumentToMarkdown } from "../markdown/prosa-markdown";
import { normalizeMarkdownSource } from "../markdown/markdown-normalize";
import type { RecoveryCandidate } from "./recovery-policy";
import { isLegacyInternalManuscriptId, isLibraryManuscript } from "./manuscript-id";

export interface LoadedManuscript {
  summary: ManuscriptSummary;
  document: ProsaDocument;
}

export interface LibraryInfo {
  rootPath: string;
  exists: boolean;
  project?: ScriboProjectManifest;
}

interface LoadedManuscriptPayload {
  summary: ManuscriptSummary;
  documentJson?: string;
  markdown?: string;
}

interface RecoverySnapshotPayload {
  capturedAt: string;
  documentJson: string;
}

export {
  isLegacyInternalManuscriptId,
  isLibraryManuscript,
  isLibraryManuscriptId,
} from "./manuscript-id";

function documentFromPayload(payload: LoadedManuscriptPayload): ProsaDocument {
  if (payload.markdown != null) {
    const base = createEmptyProsaDocument(payload.summary.title);
    const parsed = markdownToProsaDocument(base, payload.markdown);
    return { ...parsed, title: payload.summary.title };
  }
  if (payload.documentJson) {
    return deserializeProsaDocument(payload.documentJson);
  }
  return createEmptyProsaDocument(payload.summary.title);
}

export async function initLibrary(): Promise<LibraryInfo> {
  return invoke<LibraryInfo>("init_library");
}

export async function getLibrary(): Promise<LibraryInfo> {
  return invoke<LibraryInfo>("get_library");
}

export async function setLibraryRoot(rootPath: string): Promise<LibraryInfo> {
  return invoke<LibraryInfo>("set_library", { rootPath });
}

export async function revealLibraryFolder(): Promise<void> {
  await invoke("reveal_library_folder");
}

export async function revealManuscriptInFileManager(id: string): Promise<void> {
  await invoke("reveal_in_file_manager", { id });
}

export async function importMarkdownFile(path: string): Promise<LoadedManuscript> {
  const payload = await invoke<LoadedManuscriptPayload>("import_markdown_file", { path });
  return {
    summary: payload.summary,
    document: documentFromPayload(payload),
  };
}

export async function listManuscripts(): Promise<ManuscriptSummary[]> {
  return invoke<ManuscriptSummary[]>("list_manuscripts");
}

export async function listLegacyInternalManuscripts(): Promise<ManuscriptSummary[]> {
  return invoke<ManuscriptSummary[]>("list_legacy_internal_manuscripts");
}

export async function migrateLegacyManuscriptToLibrary(id: string): Promise<LoadedManuscript> {
  const loaded = await loadManuscript(id);
  const markdown = prosaDocumentToMarkdown(loaded.document);
  const payload = await invoke<LoadedManuscriptPayload>("migrate_internal_manuscript", {
    id,
    title: loaded.document.title || loaded.summary.title || "Untitled",
    markdown,
  });
  return {
    summary: payload.summary,
    document: documentFromPayload(payload),
  };
}

export async function migrateAllLegacyManuscriptsToLibrary(): Promise<number> {
  const legacy = await listLegacyInternalManuscripts();
  let migrated = 0;
  for (const item of legacy) {
    if (!isLegacyInternalManuscriptId(item.id)) {
      continue;
    }
    await migrateLegacyManuscriptToLibrary(item.id);
    migrated += 1;
  }
  return migrated;
}

export async function createManuscript(title: string): Promise<LoadedManuscript> {
  const document = createEmptyProsaDocument(title);
  const payload = await invoke<LoadedManuscriptPayload>("create_manuscript", {
    title,
    documentJson: serializeProsaDocument(document),
  });
  return {
    summary: payload.summary,
    document: documentFromPayload(payload),
  };
}

export async function loadManuscript(id: string): Promise<LoadedManuscript> {
  const payload = await invoke<LoadedManuscriptPayload>("load_manuscript", { id });
  return {
    summary: payload.summary,
    document: documentFromPayload(payload),
  };
}

export async function getManuscriptDiskRevision(id: string): Promise<string> {
  const result = await invoke<{ modifiedAt: string }>("get_manuscript_disk_revision", { id });
  return result.modifiedAt;
}

export async function loadRecoveryCandidate(id: string): Promise<RecoveryCandidate | null> {
  const payload = await invoke<RecoverySnapshotPayload | null>("load_recovery_snapshot", { id });
  if (!payload) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.documentJson) as unknown;
  } catch {
    return null;
  }
  const validated = tryValidateProsaDocument(parsed);
  if (!validated.success) {
    return null;
  }
  return {
    capturedAt: payload.capturedAt,
    document: validated.data,
  };
}

export async function saveManuscriptDocument(
  id: string,
  document: ProsaDocument,
  summary: ManuscriptSummary | null | undefined,
): Promise<ManuscriptSummary> {
  const documentJson = serializeProsaDocument(document);
  if (isLibraryManuscript(summary, id)) {
    const markdown = normalizeMarkdownSource(prosaDocumentToMarkdown(document));
    return invoke<ManuscriptSummary>("save_manuscript", {
      id,
      documentJson,
      markdown,
    });
  }
  return invoke<ManuscriptSummary>("save_manuscript", {
    id,
    documentJson,
    markdown: null,
  });
}

export async function saveRecoverySnapshot(id: string, document: ProsaDocument): Promise<void> {
  const documentJson = serializeProsaDocument(document);
  await invoke("save_recovery_snapshot", { id, documentJson });
}

export async function clearRecoverySnapshot(id: string): Promise<void> {
  await invoke("clear_recovery_snapshot", { id });
}

export async function deleteManuscript(id: string): Promise<void> {
  await invoke("delete_manuscript", { id });
}
