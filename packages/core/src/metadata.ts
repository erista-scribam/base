import type { DocumentId, ManuscriptId } from "./ids";

export interface ManuscriptMetadata {
  id: ManuscriptId;
  title: string;
  documentId: DocumentId;
  createdAt: string;
  updatedAt: string;
}

export type ManuscriptSource = "library" | "internal";

export interface ManuscriptSummary {
  id: ManuscriptId;
  title: string;
  updatedAt: string;
  /** File birth time when available; internal manuscripts use meta createdAt. */
  createdAt?: string;
  /** Relative path under library root, or absolute path for external files. */
  filePath?: string;
  source?: ManuscriptSource;
}
