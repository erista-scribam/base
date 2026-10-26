import {
  displayProsaManuscriptFileName,
  isProsaManuscriptFileName,
  normalizeNewManuscriptTitleInput,
} from "@scribam/mdprosa";

/** Strip manuscript extension for UI labels. */
export function displayMarkdownFileName(fileNameOrPath: string): string {
  return displayProsaManuscriptFileName(fileNameOrPath);
}

export function displayMarkdownRepoPath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index < 0) {
    return displayMarkdownFileName(normalized);
  }
  const directory = normalized.slice(0, index);
  const fileName = displayMarkdownFileName(normalized.slice(index + 1));
  return `${directory}/${fileName}`;
}

export function normalizeNewManuscriptTitle(input: string): string {
  return normalizeNewManuscriptTitleInput(input);
}

export function isMarkdownRepoPath(relativePath: string): boolean {
  const base = relativePath.replace(/\\/g, "/").split("/").pop() ?? relativePath;
  return isProsaManuscriptFileName(base);
}
