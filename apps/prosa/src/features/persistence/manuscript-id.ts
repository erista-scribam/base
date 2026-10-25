import type { ManuscriptSummary } from "@scribo/core";

export function isLibraryManuscriptId(id: string): boolean {
  return id.startsWith("ms_path_");
}

export function isLegacyInternalManuscriptId(id: string): boolean {
  return id.startsWith("ms_") && !isLibraryManuscriptId(id);
}

export function isLibraryManuscript(
  summary: ManuscriptSummary | null | undefined,
  manuscriptId?: string | null,
): boolean {
  if (manuscriptId && isLibraryManuscriptId(manuscriptId)) {
    return true;
  }
  if (!summary) {
    return false;
  }
  return summary.source === "library" || isLibraryManuscriptId(summary.id);
}
