import { invoke } from "@tauri-apps/api/core";
import type { ManuscriptSummary } from "@scribo/core";
import type { ProsaDocument } from "@scribo/document-model";
import {
  createEmptyProsaDocument,
  deserializeProsaDocument,
  serializeProsaDocument,
} from "@scribo/document-model";
import {
  markdownToProsaDocument,
  prosaDocumentToMarkdown,
} from "../markdown/prosa-markdown";

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

export async function loadRecoverySnapshot(id: string): Promise<ProsaDocument | null> {
  const json = await invoke<string | null>("load_recovery_snapshot", { id });
  return json ? deserializeProsaDocument(json) : null;
}

/** @deprecated Use saveManuscriptDocument */
export async function saveManuscript(
  id: string,
  document: ProsaDocument,
): Promise<ManuscriptSummary> {
  return saveManuscriptDocument(id, document, null);
}
