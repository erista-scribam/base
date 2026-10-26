/** Strip `.md` / `.markdown` for UI labels (project manuscripts are always markdown). */
export function displayMarkdownFileName(fileNameOrPath: string): string {
  const normalized = fileNameOrPath.replace(/\\/g, "/");
  const base = normalized.split("/").pop() ?? normalized;
  return base.replace(/\.(md|markdown)$/i, "");
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

/** Normalize user input to a title stem (`.md` is added on disk). */
export function normalizeNewManuscriptTitle(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/\.(md|markdown)$/i, "").trim();
}

export function isMarkdownRepoPath(relativePath: string): boolean {
  return /\.(md|markdown)$/i.test(relativePath.replace(/\\/g, "/"));
}
