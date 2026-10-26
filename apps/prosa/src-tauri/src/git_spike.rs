//! libgit2 feasibility experiments (plan 005 Phase 3). Not linked in release builds.

#[cfg(all(test, feature = "git-spike"))]
mod tests {
    use std::fs;
    use std::path::Path;
    use std::time::Instant;

    use git2::{IndexAddOption, Repository, Signature};
    use tempfile::TempDir;

    use crate::atomic_io::atomic_write;

    fn spike_signature() -> Signature<'static> {
        Signature::now("Scribam Spike", "spike@scribam.local").expect("valid signature")
    }

    fn init_repo(dir: &Path) -> Repository {
        Repository::init(dir).expect("git init")
    }

    fn commit_all(repo: &Repository, message: &str) -> git2::Oid {
        let mut index = repo.index().expect("index");
        index
            .add_all(["*"].iter(), IndexAddOption::DEFAULT, None)
            .expect("index add");
        index.write().expect("index write");
        let tree_id = index.write_tree().expect("write tree");
        let tree = repo.find_tree(tree_id).expect("tree");
        let sig = spike_signature();
        let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
        match parent {
            Some(parent) => repo
                .commit(Some("HEAD"), &sig, &sig, message, &tree, &[&parent])
                .expect("commit"),
            None => repo
                .commit(Some("HEAD"), &sig, &sig, message, &tree, &[])
                .expect("initial commit"),
        }
    }

    fn write_and_commit(repo: &Repository, root: &Path, rel: &str, body: &str, message: &str) {
        let path = root.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).ok();
        }
        atomic_write(&path, body).expect("atomic write");
        commit_all(repo, message);
    }

    #[test]
    fn experiment_1_init_repo_clean_status() {
        let tmp = TempDir::new().expect("tempdir");
        let _repo = init_repo(tmp.path());
        let output = std::process::Command::new("git")
            .args([
                "-C",
                tmp.path().to_str().expect("utf8 path"),
                "status",
                "--porcelain",
            ])
            .output()
            .expect("git status");
        assert!(
            output.status.success(),
            "git status failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(
            output.stdout.is_empty(),
            "expected clean tree, got {:?}",
            String::from_utf8_lossy(&output.stdout)
        );
    }

    #[test]
    fn experiment_2_atomic_write_then_commit() {
        let tmp = TempDir::new().expect("tempdir");
        let repo = init_repo(tmp.path());
        write_and_commit(
            &repo,
            tmp.path(),
            "content/manuscripts/ch-01.md",
            "# One\n\nParagraph.",
            "Add chapter",
        );
        let head = repo.head().expect("head").peel_to_commit().expect("commit");
        let tree = head.tree().expect("tree");
        let entry = tree
            .get_path(Path::new("content/manuscripts/ch-01.md"))
            .expect("path in tree");
        let blob = repo.find_blob(entry.id()).expect("blob");
        assert_eq!(blob.content(), b"# One\n\nParagraph.");
    }

    #[test]
    fn experiment_3_branch_create_and_checkout() {
        let tmp = TempDir::new().expect("tempdir");
        let repo = init_repo(tmp.path());
        write_and_commit(&repo, tmp.path(), "draft.md", "main branch", "main");
        let head = repo.head().expect("head").peel_to_commit().expect("commit");
        repo.branch("experiment", &head, false).expect("branch");
        repo.set_head("refs/heads/experiment").expect("set head");
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .expect("checkout");
        write_and_commit(
            &repo,
            tmp.path(),
            "draft.md",
            "experiment branch",
            "on experiment",
        );
        let on_disk = fs::read_to_string(tmp.path().join("draft.md")).expect("read");
        assert_eq!(on_disk, "experiment branch");
    }

    #[test]
    fn experiment_4_merge_produces_conflict_markers() {
        let tmp = TempDir::new().expect("tempdir");
        let repo = init_repo(tmp.path());
        write_and_commit(
            &repo,
            tmp.path(),
            "story.md",
            "Intro\n\nShared paragraph.",
            "base",
        );

        let main_branch = repo
            .head()
            .expect("head")
            .shorthand()
            .expect("branch name")
            .to_string();
        let head = repo.head().expect("head").peel_to_commit().expect("commit");
        repo.branch("feature", &head, false).expect("branch");
        repo.set_head("refs/heads/feature").expect("set head");
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .expect("checkout feature");
        write_and_commit(
            &repo,
            tmp.path(),
            "story.md",
            "Intro\n\nFeature version.",
            "feature edit",
        );

        repo.set_head(&format!("refs/heads/{main_branch}"))
            .expect("main head");
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .expect("checkout main");
        write_and_commit(
            &repo,
            tmp.path(),
            "story.md",
            "Intro\n\nMain version.",
            "main edit",
        );

        let root = tmp.path().to_str().expect("utf8 path");
        let output = std::process::Command::new("git")
            .args(["-C", root, "merge", "feature", "--no-edit"])
            .output()
            .expect("git merge");
        assert!(
            !output.status.success(),
            "expected merge conflict, got clean merge"
        );

        let merged = fs::read_to_string(tmp.path().join("story.md")).unwrap_or_default();
        assert!(
            merged.contains("<<<<<<<") || merged.contains("======="),
            "expected conflict markers in working tree, got: {merged:?}"
        );
    }

    #[test]
    fn experiment_5_paragraph_granularity_diff() {
        let before = "Line one.\n\nLine two.\n\nLine three.";
        let after = "Line one.\n\nLine two changed.\n\nLine three.";
        let diff = paragraph_diff_lines(before, after);
        assert!(diff.iter().any(|line| line.contains("two changed")));
        assert!(diff.len() >= 2);
    }

    fn paragraph_diff_lines(before: &str, after: &str) -> Vec<String> {
        let a: Vec<_> = before.split("\n\n").collect();
        let b: Vec<_> = after.split("\n\n").collect();
        let mut out = Vec::new();
        let max = a.len().max(b.len());
        for i in 0..max {
            match (a.get(i), b.get(i)) {
                (Some(x), Some(y)) if x != y => {
                    out.push(format!("- {x}"));
                    out.push(format!("+ {y}"));
                }
                (None, Some(y)) => out.push(format!("+ {y}")),
                (Some(x), None) => out.push(format!("- {x}")),
                _ => {}
            }
        }
        out
    }

    #[test]
    fn interrupted_write_leaves_head_unchanged_without_commit() {
        let tmp = TempDir::new().expect("tempdir");
        let repo = init_repo(tmp.path());
        write_and_commit(&repo, tmp.path(), "safe.md", "v1", "first");
        let head_before = repo.head().expect("head").target().expect("oid");

        let path = tmp.path().join("safe.md");
        atomic_write(&path, "v2 uncommitted").expect("atomic write");
        let head_after = repo.head().expect("head").target().expect("oid");
        assert_eq!(head_before, head_after);
        assert_eq!(fs::read_to_string(path).expect("read"), "v2 uncommitted");
    }

    #[test]
    #[ignore = "bench: set SCRIBAM_GIT_SPIKE_BENCH=1 to run 500-file commit timing"]
    fn experiment_6_many_file_commit_timing() {
        if std::env::var("SCRIBAM_GIT_SPIKE_BENCH").ok().as_deref() != Some("1") {
            return;
        }
        let tmp = TempDir::new().expect("tempdir");
        let repo = init_repo(tmp.path());
        for i in 0..500 {
            let body = "x".repeat(2048);
            let rel = format!("content/manuscripts/file-{i:03}.md");
            let path = tmp.path().join(&rel);
            fs::create_dir_all(path.parent().expect("parent")).ok();
            atomic_write(&path, &body).expect("write");
        }
        let start = Instant::now();
        commit_all(&repo, "bulk add");
        let elapsed = start.elapsed();
        eprintln!("500-file commit: {} ms", elapsed.as_millis());
        assert!(
            elapsed.as_secs() <= 10,
            "commit took {:?}; investigate before product use",
            elapsed
        );
    }
}
