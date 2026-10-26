import { invoke } from "@tauri-apps/api/core";

export interface ProjectEntry {
  relativePath: string;
  name: string;
  kind: "folder" | "file";
  manuscriptId?: string | null;
  updatedAt?: string | null;
}

export interface ProjectTreeNode {
  name: string;
  relativePath: string;
  kind: "folder" | "file";
  manuscriptId?: string;
  updatedAt?: string;
  children: ProjectTreeNode[];
}

export function parentRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
}

export function splitRepoPath(relativePath: string): { directory: string; fileName: string } {
  const normalized = relativePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index < 0) {
    return { directory: "", fileName: normalized };
  }
  return { directory: normalized.slice(0, index), fileName: normalized.slice(index + 1) };
}

function sortNodes(nodes: ProjectTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  for (const node of nodes) {
    if (node.children.length > 0) {
      sortNodes(node.children);
    }
  }
}

export function buildProjectTree(entries: ProjectEntry[]): ProjectTreeNode[] {
  const folderMap = new Map<string, ProjectTreeNode>();
  const roots: ProjectTreeNode[] = [];

  for (const entry of entries) {
    if (entry.kind !== "folder") {
      continue;
    }
    folderMap.set(entry.relativePath, {
      name: entry.name,
      relativePath: entry.relativePath,
      kind: "folder",
      children: [],
    });
  }

  for (const folder of folderMap.values()) {
    const parent = parentRelativePath(folder.relativePath);
    if (parent && folderMap.has(parent)) {
      folderMap.get(parent)!.children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  for (const entry of entries) {
    if (entry.kind !== "file") {
      continue;
    }
    const node: ProjectTreeNode = {
      name: entry.name,
      relativePath: entry.relativePath,
      kind: "file",
      manuscriptId: entry.manuscriptId ?? undefined,
      updatedAt: entry.updatedAt ?? undefined,
      children: [],
    };
    const parent = parentRelativePath(entry.relativePath);
    if (parent && folderMap.has(parent)) {
      folderMap.get(parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortNodes(roots);
  return roots;
}

export async function listProjectTree(): Promise<ProjectEntry[]> {
  return invoke<ProjectEntry[]>("list_project_tree");
}
