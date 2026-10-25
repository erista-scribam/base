export type DocumentId = string & { readonly __brand: "DocumentId" };
export type ManuscriptId = string & { readonly __brand: "ManuscriptId" };

const DOCUMENT_ID_PREFIX = "doc_";
const MANUSCRIPT_ID_PREFIX = "ms_";

export function createDocumentId(value?: string): DocumentId {
  const id = value ?? `${DOCUMENT_ID_PREFIX}${crypto.randomUUID()}`;
  if (!isDocumentId(id)) {
    throw new Error(`Invalid document id: ${id}`);
  }
  return id;
}

export function createManuscriptId(value?: string): ManuscriptId {
  const id = value ?? `${MANUSCRIPT_ID_PREFIX}${crypto.randomUUID()}`;
  if (!isManuscriptId(id)) {
    throw new Error(`Invalid manuscript id: ${id}`);
  }
  return id;
}

export function isDocumentId(value: string): value is DocumentId {
  return value.startsWith(DOCUMENT_ID_PREFIX) && value.length > DOCUMENT_ID_PREFIX.length;
}

export function isManuscriptId(value: string): value is ManuscriptId {
  return value.startsWith(MANUSCRIPT_ID_PREFIX) && value.length > MANUSCRIPT_ID_PREFIX.length;
}
