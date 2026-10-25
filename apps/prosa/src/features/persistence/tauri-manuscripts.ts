import { invoke } from "@tauri-apps/api/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import {
  createEmptyProsaDocument,
  deserializeProsaDocument,
  serializeProsaDocument,
  tryValidateProsaDocument,
} from "@scribo/document-model";
import {
  markdownToProsaDocument,
  prosaDocumentToMarkdown,
} from "../markdown/prosa-markdown";
import type { RecoveryCandidate } from "./recovery-policy";

export interface LoadedManuscript {
  summary: ManuscriptSummary;
  document: ProsaDocument;
}

export interface LibraryInfo {
  rootPath: string;
  exists: boolean;
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

export function isLibraryManuscript(summary: ManuscriptSummary | null | undefined): boolean {
  if (!summary) {
    return false;
  }
  return summary.source === "library" || summary.id.startsWith("ms_path_");
}

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
  if (isLibraryManuscript(summary)) {
    return invoke<ManuscriptSummary>("save_manuscript", {
      id,
      documentJson,
      markdown: prosaDocumentToMarkdown(document),
    });
  }
  return invoke<ManuscriptSummary>("save_manuscript", {
    id,
    documentJson,
    markdown: null,
  });
}

export async function saveRecoverySnapshot(
  id: string,
  document: ProsaDocument,
  _summary: ManuscriptSummary | null | undefined,
): Promise<void> {
  const documentJson = serializeProsaDocument(document);
  await invoke("save_recovery_snapshot", { id, documentJson });
}
