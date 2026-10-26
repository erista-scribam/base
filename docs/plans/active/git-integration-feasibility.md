# Git integration feasibility spike

**Status:** **Executed** — see [git-spike-results.md](../../research/git-spike-results.md)  
**Parent:** [005-project-workspace-and-git.md](./005-project-workspace-and-git.md)  
**Spec:** [project-architecture-and-storage.md](../../specs/project-architecture-and-storage.md)

## Objective

Prove or disprove **libgit2 (`git2`)** as Scribam’s embedded VCS before any product UI. **This is not a production Git layer.**

## Scope

| In scope                        | Out of scope                |
| ------------------------------- | --------------------------- |
| Init repo in temp dir           | Writer-facing branch UI     |
| Add/commit normalized `.md`     | Merge UI                    |
| Create/switch branch            | Tauri packaging final       |
| Read log, simple diff           | Stable block IDs in editor  |
| One merge with conflict markers | Project manifest migrations |

## Environment

- Rust integration test crate or `apps/prosa/src-tauri` `#[cfg(test)]` module behind feature flag **`git-spike`** (Recommended—do not enable in release until approved).
- Temp directories via `tempfile` crate (**spike may add dev-dependency**—only after spike authorized; planning phase: **no lockfile change yet**).

## Experiments

| #   | Experiment                                        | Exit criterion                                                     |
| --- | ------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | `Repository::init` on project path                | Opens; `git status` clean                                          |
| 2   | Commit after atomic write simulation              | Commit OID stable; tree matches file                               |
| 3   | Branch create + checkout                          | File switch visible; no data loss                                  |
| 4   | Two-branch edit same file → merge                 | Conflict markers present; pre-merge trees recoverable              |
| 5   | Diff `md` at paragraph granularity (split `\n\n`) | Diff output usable for UI prototype                                |
| 6   | 500× 2KB files commit time                        | Record ms; flag if > 2s on M-series Mac (**measurement required**) |
| 7   | Bundle size impact of `git2`                      | Record DMG delta vs baseline                                       |

## libgit2 vs `git` CLI

|               | `git2`              | CLI                             |
| ------------- | ------------------- | ------------------------------- |
| Tauri sandbox | Embedded            | Requires git installed          |
| Merge         | API limited vs CLI  | Mature                          |
| Licensing     | Linking to AGPL app | GPL toolchain OK for invocation |

**Spike compares both** for merge (exp 4 duplicate on CLI if libgit2 merge unsatisfactory).

## Interrupted-write test

1. Write temp file via `atomic_io::atomic_write`.
2. Simulate kill before `git commit` (commit not called).
3. Assert working tree file intact; repo HEAD unchanged.

## macOS / Tauri packaging

- Document whether `git2` static link increases code-sign/notarize payload.
- **Not verified** until spike runs on release build.

## Deliverables from spike

- `docs/research/git-spike-results.md` (create when spike runs)
- Update [pending-decisions.md](../../architecture/decisions/pending-decisions.md) ADR Git row
- Go/no-go recommendation

## Risks

| Risk                                     | Severity                         |
| ---------------------------------------- | -------------------------------- |
| libgit2 + Tauri size                     | Medium                           |
| Drive-synced `.git` corruption           | High (product policy, not spike) |
| Unstable block IDs break merge semantics | **Critical**—parallel track      |

## Authorization

**Do not start spike until:** architecture spec reviewed and this plan approved.
