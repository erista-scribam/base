/** Layout v1 (shipped): `content/manuscripts`. */
export const LAYOUT_V1_MANUSCRIPTS = "content/manuscripts" as const;

/** Layout v2 (multi-app): `contents/canon/manuscripts`. */
export const LAYOUT_V2_MANUSCRIPTS = "contents/canon/manuscripts" as const;

export const LAYOUT_V2_FOLIA = "contents/canon/folia" as const;
export const LAYOUT_V2_DRAMA = "contents/canon/drama" as const;
export const LAYOUT_V2_SHARED_RESEARCH = "contents/shared/research" as const;
export const LAYOUT_V2_SHARED_ASSETS = "contents/shared/assets" as const;

export const PROJECT_MANIFEST_FILE = "scribo.project.json" as const;

export const PROJECT_LAYOUT_VERSION_V1 = 1 as const;
export const PROJECT_LAYOUT_VERSION_V2 = 2 as const;

/** Relative prefixes Prosa may write (union of v1 and v2 manuscript trees). */
export const PROSA_MANUSCRIPT_WRITE_PREFIXES = [
  LAYOUT_V1_MANUSCRIPTS,
  LAYOUT_V2_MANUSCRIPTS,
] as const;

/** Candidate manuscript roots in preference order when probing an on-disk project. */
export const MANUSCRIPTS_DIR_CANDIDATES = [LAYOUT_V2_MANUSCRIPTS, LAYOUT_V1_MANUSCRIPTS] as const;

/**
 * Pick the manuscripts directory relative path for a project root.
 * Prefer v2 when that folder exists; otherwise v1 (default for new projects).
 */
export function resolveManuscriptsRelativePath(options: {
  hasV2ManuscriptsDir: boolean;
  hasV1ManuscriptsDir: boolean;
}): typeof LAYOUT_V1_MANUSCRIPTS | typeof LAYOUT_V2_MANUSCRIPTS {
  if (options.hasV2ManuscriptsDir) {
    return LAYOUT_V2_MANUSCRIPTS;
  }
  if (options.hasV1ManuscriptsDir) {
    return LAYOUT_V1_MANUSCRIPTS;
  }
  return LAYOUT_V1_MANUSCRIPTS;
}

export function normalizeRelativePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function isUnderRelativePrefix(relativePath: string, prefix: string): boolean {
  const rel = normalizeRelativePath(relativePath);
  const base = normalizeRelativePath(prefix);
  return rel === base || rel.startsWith(`${base}/`);
}

/** True when `relativePath` is inside an allowed Prosa manuscript tree. */
export function isProsaManuscriptRelativePath(relativePath: string): boolean {
  const rel = normalizeRelativePath(relativePath);
  return PROSA_MANUSCRIPT_WRITE_PREFIXES.some((prefix) => isUnderRelativePrefix(rel, prefix));
}
