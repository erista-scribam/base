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

export interface ProjectMergeStatus {
  inProgress: boolean;
  sourceBranch: string | null;
  conflictedPaths: string[];
}

export interface ProjectVersionControl {
  initialized: boolean;
  currentBranch: string | null;
  dirty: boolean;
  branches: GitBranchSummary[];
  recentCommits: GitCommitSummary[];
  merge: ProjectMergeStatus;
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

export type MergeConflictResolution = "ours" | "theirs" | "both";

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

export async function mergeProjectBranch(sourceBranch: string): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("merge_project_branch", { sourceBranch });
}

export async function abortProjectMerge(): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("abort_project_merge");
}

export async function resolveProjectMergeFile(
  relativePath: string,
  resolution: MergeConflictResolution,
): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("resolve_project_merge_file", {
    relativePath,
    resolution,
  });
}

export async function completeProjectMerge(message?: string): Promise<ProjectVersionControl> {
  return invoke<ProjectVersionControl>("complete_project_merge", { message: message ?? null });
}

export interface ConflictRegion {
  ours: string;
  theirs: string;
}

export interface MergeConflictFilePreview {
  relativePath: string;
  regions: ConflictRegion[];
  hasMarkers: boolean;
}

export async function getMergeConflictPreview(
  relativePath: string,
): Promise<MergeConflictFilePreview> {
  return invoke<MergeConflictFilePreview>("get_merge_conflict_preview", { relativePath });
}
