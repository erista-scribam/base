use std::fs;
use std::path::Path;

use git2::{IndexAddOption, Repository, Signature, StatusOptions};
use serde::Serialize;

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
    })
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
    if branch_name.is_empty() {
        return Err("Branch name is required".into());
    }
    if branch_name.contains('/') || branch_name.contains(' ') {
        return Err("Use a simple branch name without spaces or slashes".into());
    }
    ensure_project_git(root)?;
    if is_worktree_dirty(root)? {
        return Err("Save and checkpoint (or discard) changes before creating a branch".into());
    }
    let repo = open_repo(root)?;
    let head = repo.head().map_err(|error| error.to_string())?;
    let commit = head.peel_to_commit().map_err(|error| error.to_string())?;
    repo.branch(branch_name, &commit, false)
        .map_err(|error| error.to_string())?;
    let refname = format!("refs/heads/{branch_name}");
    repo.set_head(&refname).map_err(|error| error.to_string())?;
    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
        .map_err(|error| error.to_string())?;
    project_version_control(root)
}

pub fn checkout_project_branch(root: &Path, name: &str) -> Result<ProjectVersionControl, String> {
    let branch_name = name.trim();
    if branch_name.is_empty() {
        return Err("Branch name is required".into());
    }
    ensure_project_git(root)?;
    if is_worktree_dirty(root)? {
        return Err(
            "You have uncheckpointed changes on disk. Commit a checkpoint or reload from disk before switching branches.".into(),
        );
    }
    let repo = open_repo(root)?;
    let refname = format!("refs/heads/{branch_name}");
    repo.set_head(&refname).map_err(|error| error.to_string())?;
    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
        .map_err(|error| error.to_string())?;
    project_version_control(root)
}
