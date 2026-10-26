use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

use git2::{BranchType, IndexAddOption, Repository, Signature, Sort, StatusOptions};
use serde::Serialize;

use crate::library::clear_all_library_recovery_at_root;

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
pub struct ProjectVersionControl {
    pub initialized: bool,
    pub current_branch: Option<String>,
    pub dirty: bool,
    pub branches: Vec<GitBranchSummary>,
    pub recent_commits: Vec<GitCommitSummary>,
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

    Ok(ProjectVersionControl {
        initialized: true,
        current_branch,
        dirty,
        branches,
        recent_commits,
        workspace_updated: false,
    })
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
    walk.set_sorting(Sort::TIME)
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
}
