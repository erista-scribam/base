use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

use git2::{
    AnnotatedCommit, BranchType, IndexAddOption, MergeOptions, Repository, ResetType, Signature,
    Sort, StatusOptions,
};
use serde::Serialize;

use crate::library::clear_all_library_recovery_at_root;
use crate::merge_conflicts::{
    ConflictRegion, ConflictResolution, list_conflict_regions, resolve_conflict_markers,
};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeConflictFilePreview {
    pub relative_path: String,
    pub regions: Vec<ConflictRegion>,
    pub has_markers: bool,
}

const DEFAULT_GITIGNORE: &str = ".scribo/\n";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitSummary {
    pub id: String,
    pub message: String,
    pub committed_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitBranchSummary {
    pub name: String,
    pub is_current: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMergeStatus {
    pub in_progress: bool,
    pub source_branch: Option<String>,
    pub conflicted_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectVersionControl {
    pub initialized: bool,
    pub current_branch: Option<String>,
    pub dirty: bool,
    pub branches: Vec<GitBranchSummary>,
    pub recent_commits: Vec<GitCommitSummary>,
    pub merge: ProjectMergeStatus,
    /// True when checkout updated files on disk (UI should reload manuscripts).
    #[serde(default)]
    pub workspace_updated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitGraphCommit {
    pub id: String,
    pub short_id: String,
    pub message: String,
    pub committed_at: String,
    pub parent_ids: Vec<String>,
    /// Local branch names whose tip is this commit.
    pub branch_tips: Vec<String>,
}

fn validate_branch_name(branch_name: &str) -> Result<(), String> {
    if branch_name.is_empty() {
        return Err("Branch name is required".into());
    }
    if branch_name.contains(' ') || branch_name.contains('\\') {
        return Err("Branch name cannot contain spaces or backslashes".into());
    }
    if branch_name.starts_with('.') || branch_name.ends_with('.') || branch_name.contains("..") {
        return Err("Branch name cannot start/end with '.' or contain '..'".into());
    }
    Ok(())
}

fn map_git_error(context: &str, error: git2::Error) -> String {
    let message = error.message();
    if message.contains("already exists") {
        "A branch with that name already exists".to_string()
    } else {
        format!("{context}: {message}")
    }
}

fn scribo_signature() -> Result<Signature<'static>, String> {
    Signature::now("Scribo Prosa", "prosa@local.scribo").map_err(|error| error.to_string())
}

fn open_repo(root: &Path) -> Result<Repository, String> {
    Repository::open(root).map_err(|error| error.to_string())
}

fn write_default_gitignore(root: &Path) -> Result<(), String> {
    let path = root.join(".gitignore");
    if path.exists() {
        return Ok(());
    }
    fs::write(path, DEFAULT_GITIGNORE).map_err(|error| error.to_string())
}

fn index_all_and_commit(repo: &Repository, message: &str) -> Result<(), String> {
    let mut index = repo.index().map_err(|error| error.to_string())?;
    index
        .add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
        .map_err(|error| error.to_string())?;
    index.write().map_err(|error| error.to_string())?;
    let tree_id = index.write_tree().map_err(|error| error.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|error| error.to_string())?;
    let sig = scribo_signature()?;
    let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    match parent {
        Some(parent) => {
            repo.commit(Some("HEAD"), &sig, &sig, message, &tree, &[&parent])
                .map_err(|error| error.to_string())?;
        }
        None => {
            repo.commit(Some("HEAD"), &sig, &sig, message, &tree, &[])
                .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

/// Initialize Git at project root if missing; ensure `.scribo/` is gitignored.
pub fn ensure_project_git(root: &Path) -> Result<bool, String> {
    if root.join(".git").exists() {
        return Ok(false);
    }
    Repository::init(root).map_err(|error| error.to_string())?;
    write_default_gitignore(root)?;
    let repo = open_repo(root)?;
    if repo.head().is_err() {
        index_all_and_commit(&repo, "Initialize Scribo project")?;
    }
    Ok(true)
}

pub fn is_worktree_dirty(root: &Path) -> Result<bool, String> {
    if !root.join(".git").exists() {
        return Ok(false);
    }
    let repo = open_repo(root)?;
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    opts.recurse_untracked_dirs(true);
    let statuses = repo
        .statuses(Some(&mut opts))
        .map_err(|error| error.to_string())?;
    Ok(!statuses.is_empty())
}

pub fn project_version_control(root: &Path) -> Result<ProjectVersionControl, String> {
    if !root.join(".git").exists() {
        return Ok(ProjectVersionControl {
            initialized: false,
            current_branch: None,
            dirty: false,
            branches: Vec::new(),
            recent_commits: Vec::new(),
            merge: empty_merge_status(),
            workspace_updated: false,
        });
    }
    let repo = open_repo(root)?;
    let current_branch = repo
        .head()
        .ok()
        .and_then(|head| head.shorthand().map(str::to_string));

    let mut branches = Vec::new();
    if let Ok(branch_iter) = repo.branches(None) {
        for item in branch_iter.flatten() {
            if let Some(name) = item.0.name().ok().flatten() {
                branches.push(GitBranchSummary {
                    name: name.to_string(),
                    is_current: Some(name) == current_branch.as_deref(),
                });
            }
        }
    }
    branches.sort_by(|a, b| a.name.cmp(&b.name));

    let mut recent_commits = Vec::new();
    if let Ok(head) = repo.head()
        && let Ok(commit) = head.peel_to_commit()
    {
        let mut walk = repo.revwalk().map_err(|error| error.to_string())?;
        walk.push(commit.id()).map_err(|error| error.to_string())?;
        for oid in walk.take(30) {
            let oid = oid.map_err(|error| error.to_string())?;
            let commit = repo.find_commit(oid).map_err(|error| error.to_string())?;
            recent_commits.push(GitCommitSummary {
                id: oid.to_string(),
                message: commit.message().unwrap_or("").trim().to_string(),
                committed_at: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_else(|| chrono::Utc::now().to_rfc3339()),
            });
        }
    }

    let dirty = is_worktree_dirty(root)?;

    let merge = read_merge_status(root, &repo)?;

    Ok(ProjectVersionControl {
        initialized: true,
        current_branch,
        dirty,
        branches,
        recent_commits,
        merge,
        workspace_updated: false,
    })
}

fn empty_merge_status() -> ProjectMergeStatus {
    ProjectMergeStatus {
        in_progress: false,
        source_branch: None,
        conflicted_paths: Vec::new(),
    }
}

fn parse_source_branch_from_merge_msg(message: &str) -> Option<String> {
    for line in message.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("Merge branch '")
            && let Some(name) = rest.split('\'').next()
        {
            return Some(name.to_string());
        }
    }
    None
}

fn read_merge_status(root: &Path, repo: &Repository) -> Result<ProjectMergeStatus, String> {
    let merge_head = root.join(".git/MERGE_HEAD");
    if !merge_head.exists() {
        return Ok(empty_merge_status());
    }

    let merge_msg = fs::read_to_string(root.join(".git/MERGE_MSG")).unwrap_or_default();
    let source_branch = parse_source_branch_from_merge_msg(&merge_msg);

    let index = repo.index().map_err(|error| error.to_string())?;
    let conflicted_paths = if index.has_conflicts() {
        conflicted_paths_from_index(&index)?
    } else {
        Vec::new()
    };

    Ok(ProjectMergeStatus {
        in_progress: true,
        source_branch,
        conflicted_paths,
    })
}

fn conflicted_paths_from_index(index: &git2::Index) -> Result<Vec<String>, String> {
    let mut paths = Vec::new();
    for conflict in index.conflicts().map_err(|error| error.to_string())? {
        let conflict = conflict.map_err(|error| error.to_string())?;
        for candidate in [conflict.ancestor, conflict.our, conflict.their] {
            if let Some(entry) = candidate
                && let Ok(text) = std::str::from_utf8(&entry.path)
                && !text.is_empty()
            {
                paths.push(text.to_string());
            }
        }
    }
    paths.sort();
    paths.dedup();
    Ok(paths)
}

fn annotated_branch_tip<'repo>(
    repo: &'repo Repository,
    branch_name: &str,
) -> Result<AnnotatedCommit<'repo>, String> {
    let refname = format!("refs/heads/{branch_name}");
    let reference = repo
        .find_reference(&refname)
        .map_err(|error| format!("Branch '{branch_name}' not found: {}", error.message()))?;
    repo.reference_to_annotated_commit(&reference)
        .map_err(|error| error.to_string())
}

fn require_clean_for_operation(root: &Path, repo: &Repository) -> Result<(), String> {
    if read_merge_status(root, repo)?.in_progress {
        return Ok(());
    }
    if is_worktree_dirty(root)? {
        return Err(
            "Commit or discard uncheckpointed changes before switching or merging branches.".into(),
        );
    }
    Ok(())
}

fn stage_all_and_write_index(repo: &Repository) -> Result<git2::Index, String> {
    let mut index = repo.index().map_err(|error| error.to_string())?;
    index
        .add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
        .map_err(|error| error.to_string())?;
    index.write().map_err(|error| error.to_string())?;
    Ok(index)
}

fn finalize_version_control(
    root: &Path,
    workspace_updated: bool,
) -> Result<ProjectVersionControl, String> {
    let mut status = project_version_control(root)?;
    status.workspace_updated = workspace_updated;
    Ok(status)
}

pub fn merge_project_branch(
    root: &Path,
    source_branch: &str,
) -> Result<ProjectVersionControl, String> {
    let source = source_branch.trim();
    validate_branch_name(source)?;
    ensure_project_git(root)?;
    let repo = open_repo(root)?;

    let current = repo
        .head()
        .ok()
        .and_then(|head| head.shorthand().map(str::to_string))
        .ok_or_else(|| "Cannot merge without a current branch".to_string())?;
    if current == source {
        return Err("Cannot merge a branch into itself".into());
    }

    require_clean_for_operation(root, &repo)?;

    let head_commit = repo
        .head()
        .map_err(|error| error.to_string())?
        .peel_to_commit()
        .map_err(|error| error.to_string())?;
    let annotated = annotated_branch_tip(&repo, source)?;

    let (analysis, _) = repo
        .merge_analysis(&[&annotated])
        .map_err(|error| error.to_string())?;

    if analysis.is_up_to_date() {
        return finalize_version_control(root, false);
    }

    if analysis.is_fast_forward() {
        let mut reference = repo.head().map_err(|error| error.to_string())?;
        reference
            .set_target(
                annotated.id(),
                &format!("Merge branch '{source}' (fast-forward)"),
            )
            .map_err(|error| error.to_string())?;
        let mut builder = git2::build::CheckoutBuilder::new();
        builder.force();
        repo.checkout_head(Some(&mut builder))
            .map_err(|error| error.to_string())?;
        finish_branch_switch(root)?;
        return finalize_version_control(root, true);
    }

    let mut merge_opts = MergeOptions::new();
    repo.merge(&[&annotated], Some(&mut merge_opts), None)
        .map_err(|error| format!("Merge failed: {}", error.message()))?;

    let mut index = repo.index().map_err(|error| error.to_string())?;
    if index.has_conflicts() {
        let mut checkout = git2::build::CheckoutBuilder::new();
        checkout.force();
        repo.checkout_index(Some(&mut index), Some(&mut checkout))
            .map_err(|error| format!("Could not write conflict markers: {}", error.message()))?;
        finish_branch_switch(root)?;
        return finalize_version_control(root, true);
    }

    let tree_id = index.write_tree().map_err(|error| error.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|error| error.to_string())?;
    let sig = scribo_signature()?;
    let theirs = repo
        .find_commit(annotated.id())
        .map_err(|error| error.to_string())?;
    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &format!("Merge branch '{source}'"),
        &tree,
        &[&head_commit, &theirs],
    )
    .map_err(|error| error.to_string())?;
    repo.cleanup_state().map_err(|error| error.to_string())?;
    finish_branch_switch(root)?;
    finalize_version_control(root, true)
}

pub fn abort_project_merge(root: &Path) -> Result<ProjectVersionControl, String> {
    ensure_project_git(root)?;
    let repo = open_repo(root)?;
    if !root.join(".git/MERGE_HEAD").exists() {
        return Err("No merge in progress".into());
    }
    let head_object = repo
        .head()
        .map_err(|error| error.to_string())?
        .peel(git2::ObjectType::Commit)
        .map_err(|error| error.to_string())?;
    let mut checkout = git2::build::CheckoutBuilder::new();
    checkout.force();
    repo.reset(&head_object, ResetType::Hard, Some(&mut checkout))
        .map_err(|error| format!("Could not abort merge: {}", error.message()))?;
    repo.cleanup_state().map_err(|error| error.to_string())?;
    finish_branch_switch(root)?;
    finalize_version_control(root, true)
}

pub fn resolve_project_merge_file(
    root: &Path,
    relative_path: &str,
    resolution: &str,
) -> Result<ProjectVersionControl, String> {
    let strategy = match resolution {
        "ours" => ConflictResolution::Ours,
        "theirs" => ConflictResolution::Theirs,
        "both" => ConflictResolution::Both,
        _ => return Err("Resolution must be ours, theirs, or both".into()),
    };

    ensure_project_git(root)?;
    if !root.join(".git/MERGE_HEAD").exists() {
        return Err("No merge in progress".into());
    }

    let path = root.join(relative_path);
    if !path.starts_with(root) {
        return Err("Invalid path".into());
    }
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    if !content.contains("<<<<<<<") {
        return Err("File has no conflict markers".into());
    }
    let resolved = resolve_conflict_markers(&content, strategy)?;
    fs::write(&path, resolved).map_err(|error| error.to_string())?;

    let repo = open_repo(root)?;
    let mut index = repo.index().map_err(|error| error.to_string())?;
    index
        .add_path(Path::new(relative_path))
        .map_err(|error| error.to_string())?;
    index.write().map_err(|error| error.to_string())?;

    finalize_version_control(root, true)
}

pub fn merge_conflict_preview(
    root: &Path,
    relative_path: &str,
) -> Result<MergeConflictFilePreview, String> {
    if relative_path.contains("..") {
        return Err("Invalid path".into());
    }
    let path = root.join(relative_path);
    if !path.starts_with(root) {
        return Err("Invalid path".into());
    }
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let has_markers = content.contains("<<<<<<<");
    let regions = if has_markers {
        list_conflict_regions(&content)?
    } else {
        Vec::new()
    };
    Ok(MergeConflictFilePreview {
        relative_path: relative_path.to_string(),
        regions,
        has_markers,
    })
}

pub fn complete_project_merge(
    root: &Path,
    message: Option<&str>,
) -> Result<ProjectVersionControl, String> {
    ensure_project_git(root)?;
    let repo = open_repo(root)?;
    if !root.join(".git/MERGE_HEAD").exists() {
        return Err("No merge in progress".into());
    }

    let mut index = stage_all_and_write_index(&repo)?;
    if index.has_conflicts() {
        return Err("Unresolved conflicts remain. Resolve every conflicted file first.".into());
    }

    let merge_oid = fs::read_to_string(root.join(".git/MERGE_HEAD"))
        .map_err(|error| error.to_string())?
        .trim()
        .to_string();
    let merge_commit = repo
        .find_commit(
            merge_oid
                .parse::<git2::Oid>()
                .map_err(|_| "Invalid MERGE_HEAD".to_string())?,
        )
        .map_err(|error| error.to_string())?;
    let head_commit = repo
        .head()
        .map_err(|error| error.to_string())?
        .peel_to_commit()
        .map_err(|error| error.to_string())?;

    let tree_id = index.write_tree().map_err(|error| error.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|error| error.to_string())?;
    let sig = scribo_signature()?;
    let trimmed = message.unwrap_or("").trim();
    let commit_message = if trimmed.is_empty() {
        fs::read_to_string(root.join(".git/MERGE_MSG"))
            .unwrap_or_else(|_| "Merge".into())
            .trim()
            .to_string()
    } else {
        trimmed.to_string()
    };

    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &commit_message,
        &tree,
        &[&head_commit, &merge_commit],
    )
    .map_err(|error| error.to_string())?;
    repo.cleanup_state().map_err(|error| error.to_string())?;
    finish_branch_switch(root)?;
    finalize_version_control(root, true)
}

fn checkout_local_branch(repo: &Repository, branch_name: &str) -> Result<(), String> {
    let refname = format!("refs/heads/{branch_name}");
    let reference = repo
        .find_reference(&refname)
        .map_err(|error| format!("Branch '{branch_name}' not found: {}", error.message()))?;
    let object = reference
        .peel(git2::ObjectType::Tree)
        .map_err(|error| format!("Could not read branch tree: {}", error.message()))?;
    let mut builder = git2::build::CheckoutBuilder::new();
    builder.force();
    repo.checkout_tree(&object, Some(&mut builder))
        .map_err(|error| format!("Could not switch branch: {}", error.message()))?;
    repo.set_head(&refname)
        .map_err(|error| format!("Could not update HEAD: {}", error.message()))?;
    Ok(())
}

fn finish_branch_switch(root: &Path) -> Result<(), String> {
    clear_all_library_recovery_at_root(root)
}

pub fn commit_project_checkpoint(
    root: &Path,
    message: &str,
) -> Result<ProjectVersionControl, String> {
    ensure_project_git(root)?;
    let repo = open_repo(root)?;
    let trimmed = message.trim();
    let commit_message = if trimmed.is_empty() {
        "Checkpoint"
    } else {
        trimmed
    };
    index_all_and_commit(&repo, commit_message)?;
    project_version_control(root)
}

pub fn create_project_branch(root: &Path, name: &str) -> Result<ProjectVersionControl, String> {
    let branch_name = name.trim();
    validate_branch_name(branch_name)?;
    ensure_project_git(root)?;
    let repo = open_repo(root)?;
    let head = repo.head().map_err(|error| error.to_string())?;
    let commit = head.peel_to_commit().map_err(|error| error.to_string())?;
    repo.branch(branch_name, &commit, false)
        .map_err(|error| map_git_error("Could not create branch", error))?;
    checkout_local_branch(&repo, branch_name)?;
    finish_branch_switch(root)?;
    let mut status = project_version_control(root)?;
    status.workspace_updated = true;
    Ok(status)
}

pub fn checkout_project_branch(root: &Path, name: &str) -> Result<ProjectVersionControl, String> {
    let branch_name = name.trim();
    validate_branch_name(branch_name)?;
    ensure_project_git(root)?;
    let repo = open_repo(root)?;
    require_clean_for_operation(root, &repo)?;
    checkout_local_branch(&repo, branch_name)?;
    finish_branch_switch(root)?;
    let mut status = project_version_control(root)?;
    status.workspace_updated = true;
    Ok(status)
}

fn commit_to_graph_entry(commit: &git2::Commit, branch_tips: Vec<String>) -> GitGraphCommit {
    let oid = commit.id();
    let id = oid.to_string();
    let short_id = id.chars().take(7).collect();
    let parent_ids = (0..commit.parent_count())
        .filter_map(|index| commit.parent_id(index).ok())
        .map(|parent| parent.to_string())
        .collect();
    GitGraphCommit {
        id,
        short_id,
        message: commit.message().unwrap_or("").trim().to_string(),
        committed_at: chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339()),
        parent_ids,
        branch_tips,
    }
}

pub fn project_git_graph(root: &Path, limit: usize) -> Result<Vec<GitGraphCommit>, String> {
    if !root.join(".git").exists() {
        return Ok(Vec::new());
    }
    let repo = open_repo(root)?;
    let limit = limit.clamp(1, 80);

    let mut tips_by_oid: HashMap<git2::Oid, Vec<String>> = HashMap::new();
    if let Ok(branch_iter) = repo.branches(Some(BranchType::Local)) {
        for item in branch_iter.flatten() {
            let Ok(name) = item.0.name() else {
                continue;
            };
            let Some(name) = name else {
                continue;
            };
            let reference = item.0.get();
            let Some(oid) = reference.target() else {
                continue;
            };
            tips_by_oid.entry(oid).or_default().push(name.to_string());
        }
    }

    let mut walk = repo.revwalk().map_err(|error| error.to_string())?;
    walk.set_sorting(Sort::TOPOLOGICAL | Sort::TIME)
        .map_err(|error| error.to_string())?;

    if tips_by_oid.is_empty() {
        if let Ok(head) = repo.head()
            && let Ok(commit) = head.peel_to_commit()
        {
            walk.push(commit.id()).map_err(|error| error.to_string())?;
        }
    } else {
        for oid in tips_by_oid.keys() {
            walk.push(*oid).map_err(|error| error.to_string())?;
        }
    }

    let mut seen = HashSet::new();
    let mut graph = Vec::new();
    for oid in walk {
        let oid = oid.map_err(|error| error.to_string())?;
        if !seen.insert(oid) {
            continue;
        }
        let commit = repo.find_commit(oid).map_err(|error| error.to_string())?;
        let branch_tips = tips_by_oid.get(&oid).cloned().unwrap_or_default();
        graph.push(commit_to_graph_entry(&commit, branch_tips));
        if graph.len() >= limit {
            break;
        }
    }
    Ok(graph)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn create_branch_allowed_with_dirty_worktree() {
        let root = TempDir::new().expect("tempdir");
        ensure_project_git(root.path()).expect("init");
        let path = root.path().join("draft.md");
        fs::write(&path, "edited but not checkpointed").expect("write");

        create_project_branch(root.path(), "experimental").expect("branch with dirty tree");
        let status = project_version_control(root.path()).expect("status");
        assert_eq!(status.current_branch.as_deref(), Some("experimental"));
        assert!(status.branches.iter().any(|b| b.name == "experimental"));
    }

    #[test]
    fn checkout_swaps_worktree_content() {
        let root = TempDir::new().expect("tempdir");
        let file = root.path().join("story.md");
        fs::write(&file, "main version").expect("write");
        ensure_project_git(root.path()).expect("init");
        commit_project_checkpoint(root.path(), "on main").expect("commit main");

        create_project_branch(root.path(), "alt").expect("create alt");
        fs::write(&file, "alt version").expect("write alt");
        commit_project_checkpoint(root.path(), "on alt").expect("commit alt");

        let main_name = project_version_control(root.path())
            .expect("status")
            .branches
            .iter()
            .find(|branch| branch.name != "alt")
            .map(|branch| branch.name.clone())
            .expect("main branch");

        checkout_project_branch(root.path(), &main_name).expect("checkout main");
        let on_disk = fs::read_to_string(&file).expect("read");
        assert_eq!(on_disk, "main version");
    }

    #[test]
    fn merge_reports_conflicts_and_abort_restores() {
        let root = TempDir::new().expect("tempdir");
        let file = root.path().join("story.md");
        fs::write(&file, "Shared intro.\n\nBase paragraph.").expect("write");
        ensure_project_git(root.path()).expect("init");
        commit_project_checkpoint(root.path(), "base").expect("commit");

        let main_name = project_version_control(root.path())
            .expect("status")
            .current_branch
            .clone()
            .expect("branch");

        create_project_branch(root.path(), "feature").expect("feature");
        fs::write(&file, "Shared intro.\n\nFeature paragraph.").expect("write feature");
        commit_project_checkpoint(root.path(), "on feature").expect("commit feature");

        checkout_project_branch(root.path(), &main_name).expect("back main");
        fs::write(&file, "Shared intro.\n\nMain paragraph.").expect("write main");
        commit_project_checkpoint(root.path(), "on main").expect("commit main");

        let merged = merge_project_branch(root.path(), "feature").expect("merge");
        assert!(merged.merge.in_progress);
        assert!(!merged.merge.conflicted_paths.is_empty());

        let on_disk = fs::read_to_string(&file).expect("read");
        assert!(on_disk.contains("<<<<<<<"));

        resolve_project_merge_file(root.path(), "story.md", "ours").expect("resolve");
        complete_project_merge(root.path(), Some("Merged feature")).expect("complete");

        let after = project_version_control(root.path()).expect("status");
        assert!(!after.merge.in_progress);
        let final_text = fs::read_to_string(&file).expect("read");
        assert!(final_text.contains("Main paragraph."));
        assert!(!final_text.contains("<<<<<<<"));
    }
}
