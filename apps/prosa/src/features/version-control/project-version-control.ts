import { invoke } from "@tauri-apps/api/core";

export interface GitCommitSummary {
  id: string;
  message: string;
  committedAt: string;
}

export interface GitBranchSummary {
  name: string;
  isCurrent: boolean;
}

export interface ProjectVersionControl {
  initialized: boolean;
  currentBranch: string | null;
  dirty: boolean;
  branches: GitBranchSummary[];
  recentCommits: GitCommitSummary[];
  workspaceUpdated?: boolean;
}

export interface GitGraphCommit {
  id: string;
  shortId: string;
  message: string;
  committedAt: string;
  parentIds: string[];
  branchTips: string[];
}

export async function getProjectVersionControl(): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("get_project_version_control");
}

export async function commitProjectCheckpoint(message: string): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("commit_project_checkpoint", { message });
}

export async function createProjectBranch(name: string): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("create_project_branch", { name });
}

export async function checkoutProjectBranch(name: string): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("checkout_project_branch", { name });
}

export async function getProjectGitGraph(limit = 40): Promise<GitGraphCommit[]> {
  return invoke<GitGraphCommit[]>("get_project_git_graph", { limit });
}
