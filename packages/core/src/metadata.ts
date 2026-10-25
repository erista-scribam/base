import type { DocumentId, ManuscriptId } from "./ids";

export interface ManuscriptMetadata {
  id: ManuscriptId;
  title: string;
  documentId: DocumentId;
  createdAt: string;
  updatedAt: string;
}

export interface ManuscriptSummary {
  id: ManuscriptId;
  title: string;
  updatedAt: string;
}
