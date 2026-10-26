import type { ScriboAppId } from "./apps";
import { isProsaManuscriptRelativePath, normalizeRelativePath } from "./layout";

export type PathOperation = "read" | "write" | "createDelete";

export interface AppPathOperations {
  read?: string[];
  write?: string[];
  createDelete?: string[];
}

export interface AppCapabilityDeclaration {
  appId: ScriboAppId;
  allowedOperations?: AppPathOperations;
}

export interface ProjectAppsBlock {
  prosa?: AppCapabilityDeclaration;
  folio?: AppCapabilityDeclaration;
  drama?: AppCapabilityDeclaration;
}

export const SCRIBO_PATH_FORBIDDEN = "ERR_SCRIBO_PATH_FORBIDDEN" as const;

const DEFAULT_PROSA_WRITE = ["content/manuscripts", "contents/canon/manuscripts"] as const;

const DEFAULT_PROSA_READ = [
  ...DEFAULT_PROSA_WRITE,
  "contents/shared",
  "scribo.project.json",
] as const;

export function defaultProsaCapabilities(): AppCapabilityDeclaration {
  return {
    appId: "com.scribo.prosa",
    allowedOperations: {
      read: [...DEFAULT_PROSA_READ],
      write: [...DEFAULT_PROSA_WRITE],
      createDelete: [...DEFAULT_PROSA_WRITE],
    },
  };
}

function prefixesForOp(cap: AppCapabilityDeclaration, op: PathOperation): string[] {
  const ops = cap.allowedOperations;
  if (!ops) {
    return op === "read" ? [...DEFAULT_PROSA_READ] : [...DEFAULT_PROSA_WRITE];
  }
  const list = ops[op === "createDelete" ? "createDelete" : op];
  return list?.length ? list : op === "read" ? [...DEFAULT_PROSA_READ] : [...DEFAULT_PROSA_WRITE];
}

export function assertPathAllowed(
  relativePath: string,
  op: PathOperation,
  cap: AppCapabilityDeclaration = defaultProsaCapabilities(),
): void {
  const rel = normalizeRelativePath(relativePath);
  if (rel.includes("..")) {
    throw new Error(SCRIBO_PATH_FORBIDDEN);
  }
  const allowed = prefixesForOp(cap, op);
  const ok = allowed.some((prefix) => {
    const base = normalizeRelativePath(prefix);
    return rel === base || rel.startsWith(`${base}/`);
  });
  if (!ok) {
    throw new Error(SCRIBO_PATH_FORBIDDEN);
  }
}

/** Manuscript prose files must live under a manuscript tree (stricter than manifest read). */
export function assertProsaManuscriptPath(relativePath: string): void {
  if (!isProsaManuscriptRelativePath(relativePath)) {
    throw new Error(SCRIBO_PATH_FORBIDDEN);
  }
}
