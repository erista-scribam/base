# Git integration feasibility spike — results

**Date:** 2026-10-26  
**Plan:** [git-integration-feasibility.md](../plans/active/git-integration-feasibility.md)  
**Code:** `apps/prosa/src-tauri/src/git_spike.rs` (feature flag `git-spike`, not in release builds)

## How to reproduce

```bash
pnpm verify:git-spike
# Optional bulk commit bench (~500 × 2KB files):
cd apps/prosa/src-tauri && SCRIBAM_GIT_SPIKE_BENCH=1 cargo test --features git-spike experiment_6 -- --ignored
```

Requires **`git` CLI** on PATH for experiments 1 (status check) and 4 (merge with conflict markers). libgit2 handles init, commit, branch, and checkout in-process.

## Experiment results

| #   | Experiment                         | Result      | Notes                                                                              |
| --- | ---------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| 1   | `Repository::init` + clean status  | **Pass**    | `git status --porcelain` empty after init                                          |
| 2   | Atomic write + commit              | **Pass**    | HEAD tree blob matches `atomic_io::atomic_write` contents                          |
| 3   | Branch create + checkout           | **Pass**    | File content switches on branch tip                                                |
| 4   | Divergent merge → conflict markers | **Pass**    | libgit2 commits on two branches; **`git merge`** leaves `<<<<<<<` in working tree  |
| 5   | Paragraph `\n\n` diff prototype    | **Pass**    | Simple chunk diff suitable for UI listing                                          |
| 6   | 500 × 2KB files commit             | **Pass**    | Wall time ~2s on spike runner (under 10s guard); re-run locally on target hardware |
| 7   | Release DMG / notarize size delta  | **Not run** | Needs signed release build baseline vs `git2` linked                               |

## Interrupted write

**Pass:** After an initial commit, `atomic_write` without a subsequent commit leaves **HEAD unchanged** and the working tree file updated—matches spec § interrupted-write test.

## libgit2 vs CLI (merge)

| Aspect                 | libgit2 (`git2` 0.20)                   | CLI (`git merge`)                          |
| ---------------------- | --------------------------------------- | ------------------------------------------ |
| Init / commit / branch | Used in spike                           | Status + merge only in spike               |
| Merge conflicts        | API available; spike used CLI for exp 4 | Conflict markers in `story.md` as expected |
| Runtime dependency     | Embeddable in Tauri                     | User must have Git installed               |

**Recommendation:** **Hybrid for product MVP** — libgit2 for init, index, commit, log, diff; invoke **`git merge`** (or document libgit2 merge once conflict UX is prototyped) if embedded merge ergonomics lag CLI.

## Go / no-go

| Criterion                       | Verdict                                             |
| ------------------------------- | --------------------------------------------------- |
| Technical feasibility (desktop) | **Go** — spike tests pass                           |
| Performance (500-file commit)   | **Go** — acceptable on dev machine                  |
| Packaging / size                | **Conditional** — measure DMG before Phase 4        |
| Block stable IDs                | **Go** — Phase 1 shipped                            |
| iCloud/Drive `.git` corruption  | **Product policy** — warn in UI; out of spike scope |

**Overall:** **Proceed to Phase 4 planning** (Git history MVP) with optional `git2` dependency behind feature flag until packaging evidence is recorded.

## Follow-ups

1. Release build size comparison with `git2` enabled.
2. Tauri command surface: init repo at project root, commit after successful library save (policy TBD).
3. Writer-facing conflict UI — consume CLI or libgit2 conflict index.
4. Default `.gitignore` for `.scribam/` when initializing project Git.
