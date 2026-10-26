export type ProjectId = string & { readonly __brand: "ProjectId" };

export const PROJECT_SCHEMA_VERSION = 1 as const;
export type ProjectSchemaVersion = typeof PROJECT_SCHEMA_VERSION;

export const PROJECT_LAYOUT_VERSION = 1 as const;
export type ProjectLayoutVersion = typeof PROJECT_LAYOUT_VERSION;

const PROJECT_ID_PREFIX = "proj_";

export function createProjectId(value?: string): ProjectId {
  const id = value ?? `${PROJECT_ID_PREFIX}${crypto.randomUUID()}`;
  if (!isProjectId(id)) {
    throw new Error(`Invalid project id: ${id}`);
  }
  return id;
}

export function isProjectId(value: string): value is ProjectId {
  return value.startsWith(PROJECT_ID_PREFIX) && value.length > PROJECT_ID_PREFIX.length;
}

/** Writer-facing project entry (folder + manifest), distinct from a single manuscript. */
export interface ProjectSummary {
  rootPath: string;
  title: string;
  id: string | null;
  lastOpenedAt: string;
  isCurrent: boolean;
}

/** On-disk `scribo.project.json` (plan 005). */
export interface ScriboProjectManifest {
  projectSchemaVersion: ProjectSchemaVersion;
  id: ProjectId;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** `content/manuscripts` layout; 0 = legacy flat library root only. */
  layoutVersion?: ProjectLayoutVersion;
}
