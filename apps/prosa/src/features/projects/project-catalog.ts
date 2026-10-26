import type { ProjectSummary } from "@scribo/core";
import { invoke } from "@tauri-apps/api/core";
import type { LibraryInfo } from "../persistence/tauri-manuscripts";

export type { ProjectSummary };

export async function listProjects(): Promise<ProjectSummary[]> {
  return invoke<ProjectSummary[]>("list_projects_catalog");
}

export async function openProject(rootPath: string): Promise<LibraryInfo> {
  return invoke<LibraryInfo>("open_project", { rootPath });
}

export async function createProject(parentPath: string, name: string): Promise<LibraryInfo> {
  return invoke<LibraryInfo>("create_project", { parentPath, name });
}
