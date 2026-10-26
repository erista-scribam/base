export const MDPROSA_EXTENSION = "mdprosa" as const;
export const MDPROSA_FORMAT_VERSION = 1 as const;

export const LEGACY_MARKDOWN_EXTENSIONS = ["md", "markdown"] as const;

export const MDPROSA_FRONT_MATTER_KEY = "scribo-format-version" as const;

/** File names recognized as Prosa on-disk manuscript prose (dual-read `.md` + `.mdprosa`). */
export function isProsaManuscriptFileName(fileNameOrPath: string): boolean {
  const base = fileNameOrPath.replace(/\\/g, "/").split("/").pop() ?? fileNameOrPath;
  const lower = base.toLowerCase();
  if (lower.endsWith(`.${MDPROSA_EXTENSION}`)) {
    return true;
  }
  return LEGACY_MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
}

export function displayProsaManuscriptFileName(fileNameOrPath: string): string {
  const base = fileNameOrPath.replace(/\\/g, "/").split("/").pop() ?? fileNameOrPath;
  return base
    .replace(/\.mdprosa$/i, "")
    .replace(/\.markdown$/i, "")
    .replace(/\.md$/i, "");
}

export function normalizeNewManuscriptTitleInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  return displayProsaManuscriptFileName(trimmed).trim();
}

/** Preferred on-disk extension for new saves (dual-read legacy `.md`). */
export function preferredManuscriptExtension(): string {
  return MDPROSA_EXTENSION;
}
