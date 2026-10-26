import { invoke } from "@tauri-apps/api/core";

export interface LanistaProject {
  rootPath: string;
  title: string;
  id: string | null;
}

export interface LanistaHome {
  homePath: string;
}

export async function getLanistaHome(): Promise<LanistaHome> {
  return invoke<LanistaHome>("get_lanista_home");
}

export async function listLanistaProjects(): Promise<LanistaProject[]> {
  return invoke<LanistaProject[]>("list_lanista_projects");
}

export async function createLanistaProject(name: string): Promise<LanistaProject> {
  return invoke<LanistaProject>("create_lanista_project", { name });
}

export async function openProjectInProsa(rootPath: string): Promise<void> {
  await invoke("open_project_in_prosa", { rootPath });
}
