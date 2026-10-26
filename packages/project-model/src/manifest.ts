import type { ProjectId, ScribamProjectManifest } from "@scribam/core";
import type { ProjectAppsBlock } from "./capabilities";

export const PROJECT_SCHEMA_VERSION_V2 = 2 as const;

/** Optional v2 manifest fields (v1 projects omit them). */
export interface ProjectManifestExtensions {
  apps?: ProjectAppsBlock;
  migratedFromLayout?: number;
}

export type ScribamProjectManifestV2 = ScribamProjectManifest &
  ProjectManifestExtensions & {
    projectSchemaVersion: typeof PROJECT_SCHEMA_VERSION_V2;
  };

export function isManifestV2(
  manifest: ScribamProjectManifest & ProjectManifestExtensions,
): boolean {
  return manifest.projectSchemaVersion >= PROJECT_SCHEMA_VERSION_V2;
}

export interface ProjectIdentity {
  id: ProjectId;
  title: string;
}
