# Plan — Git repository strategy decision

**Status:** **Provisional default — Option A** (2026-10-26). Formal ADR acceptance still pending; implementation matches Option A today.  
**Spec:** [multi-application-project-architecture.md](../../specs/multi-application-project-architecture.md) §6  
**Conflict:** [006-scribo-lanista-platform.md](./006-scribo-lanista-platform.md) proposes **per-manuscript Git**

## Question

For the Scribo **multi-application** project model, should version control be:

- **Option A:** One Git repository per **project** (root `.git`).
- **Option B:** Separate repositories per **domain** (`manuscripts`, `folia`, `drama`) or per **manuscript package**.
- **Option C:** Hybrid — project repo for manifest + shared; optional nested repos when evidence supports it.

## Verified current state

| Fact                                                | Evidence                                       |
| --------------------------------------------------- | ---------------------------------------------- |
| Implementation matches **Option A** at project root | `ensure_project_git(root)` in `project_git.rs` |
| `.scribo/` ignored                                  | `DEFAULT_GITIGNORE`                            |
| Git feature default-on                              | `Cargo.toml` `default = ["git-vcs"]`           |
| UI + commands for branch/merge/conflict             | `SourceControlPanel`, `project_git.rs`         |
| Spike tests exist                                   | `git_spike.rs`, `pnpm verify:git-spike`        |

## Comparison (summary)

See full table in [multi-application-project-architecture.md §6](../../specs/multi-application-project-architecture.md).

| Option | Best when                                              | Main cost                              |
| ------ | ------------------------------------------------------ | -------------------------------------- |
| **A**  | Shared milestones, single backup, matches today        | Blast radius; apps must respect grants |
| **B**  | Domains ship on different cadences; huge binary splits | Cross-domain atomicity; UX complexity  |
| **C**  | Proven pain on A (size, isolation)                     | Highest maintenance                    |

**Spec default recommendation:** **Option A** for the **family architecture**, with strict capability enforcement.

**006 recommendation:** Per-manuscript repos for Prosa blast radius — treat as **Option B subset** requiring **separate ADR** if chosen over A.

---

## Required experiments (before Accept)

| ID  | Experiment                           | Pass criteria                                                                                       | Owner                                                        |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| E1  | **Unified repo** multi-domain commit | Single commit touches `canon/manuscripts/a.mdprosa` + `shared/research/note.md`; `git log` coherent | Rust integration test                                        |
| E2  | **Split repo** prototype             | Two repos under one project; reference asset across repos — document ref breakage                   | Spike doc only                                               |
| E3  | **Per-manuscript** repo (006)        | 10 manuscript repos: clone size, status UX, Lanista open flow                                       | Manual + fixture                                             |
| E4  | **Migration** project-root → per-ms  | Split existing test repo; measure history preservation                                              | [layout-v2-migration.md](../../specs/layout-v2-migration.md) |
| E5  | **Drive conflict** simulation        | Document behavior only — two machines, same cloud folder, concurrent commit                         | Written scenario (no false safety claims)                    |
| E6  | **Interrupt** commit/checkout        | Existing tests extended for v2 paths                                                                | CI                                                           |

**Not required:** Benchmark libgit2 vs CLI unless packaging regresses.

---

## Measurable acceptance criteria (decision)

Choose **Option A** if:

- E1 passes.
- E3 shows per-manuscript overhead **> agreed threshold** (e.g. >5 repos confuses writer UX in internal test).
- Cross-domain checkpoint is a **stated product requirement**.

Choose **Option B/C** if:

- E3 passes UX bar **and** E4 preserves acceptable history **and** product accepts losing single-repo milestone commits.

**Blocked if:** E4 cannot preserve history without user-visible data loss and no backup story.

---

## Production Git approval checklist (any option)

- [ ] Grant enforcement prevents `git` operations outside app capability paths (or scoped porcelain).
- [ ] Autosave flush before destructive Git operations.
- [ ] Branch switch clears or migrates recovery sidecars (`clear_all_library_recovery_at_root` pattern).
- [ ] Corrupt repo → visible error, no empty manuscript.
- [ ] Merge conflict UI scoped to app-readable files.
- [ ] Documentation: Drive/iCloud **not supported** for live editing.

---

## Deliverables

| Deliverable          | Path                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| Decision record      | `docs/architecture/decisions/pending-decisions.md` row → ADR when approved  |
| Spike results update | `docs/research/git-spike-results.md` (append v2 section)                    |
| Manuscript Git spec  | [manuscript-git-v1.md](../../specs/manuscript-git-v1.md) — only if B/C wins |

---

## Recommendation (planning stance)

1. **Short term:** Keep **Option A** in code; do not invest in per-manuscript split until E3–E4 complete.
2. **Reconcile 006:** Either amend 006 to unified repo + path-scoped VC UI, or accept hybrid with explicit ADR **before** Phase E of 006.

**Status:** **Ready for bounded feasibility spike** (E1, E3, E4); **not Ready for production** migration.
