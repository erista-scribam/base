# Project architecture and storage specification

**Status:** Draft — **historical / audit baseline**; **execution** moved to [006-scribo-lanista-platform.md](../plans/active/006-scribo-lanista-platform.md) and [lanista-platform-and-storage.md](./lanista-platform-and-storage.md)  
**Plan:** [005-project-workspace-and-git.md](../plans/active/005-project-workspace-and-git.md) (paused)  
**Philosophy:** [philosophy.md](../product/philosophy.md)

**Legend:** **Verified** = inspected in repo; **Documented** = docs only; **Recommended** = proposal; **Assumption** = needs spike.

**Product context:** [prosa-shell-and-projects.md](../product/prosa-shell-and-projects.md) — IDE-like UI for navigation/history; writing app first; not forking an IDE; **Scribo Prosa home** as default root with **projects as subfolders**.

---

## 1. Executive summary

**Recommended direction (Recommended):**

1. **Live format:** A **project directory** on disk (user-visible folder) with a `scribo.project.json` manifest, a `content/` tree of versioned manuscripts, optional `workspace/` and `knowledge/` JSON/YAML, and a **Git repository** at project root for authored + manifest history.
2. **Git engine:** Integrate **libgit2** (`git2` crate) in the Rust/Tauri layer for commits, branches, merges, and diffs; expose writer-oriented commands to TypeScript—**after** a bounded feasibility spike (**Not executed**).
3. **SQLite:** **Rebuildable indexes only** (search, backlinks, entity occurrence lists)—never an authoritative copy of prose (**Recommended**).
4. **Portable package:** Optional `.scribo` archive (zip or custom container) for backup/import—**not** the live editing format (**Recommended**).
5. **Migration:** Current **library folder** (flat `.md` + app config) maps to **single-manuscript projects** or **multi-doc projects** via import tool (**Assumption**—details in roadmap).
6. **Prosa home (Recommended):** Default `Documents/Scribo Prosa/` (or user-chosen) is the **app home**; each **writing project** is a **child folder** with its own manifest and Git root—not manuscripts scattered at the home root long term.

**Principal risk:** Stable **entity IDs** across TipTap/Markdown round-trips are **not verified** today (`blockId()` regenerates UUIDs in `prosa-convert.ts`, `prosa-markdown.ts`)—Git merges and workspace references **require** ID stability first.

---

## 2. Current-state audit

See [§2 detail table](#22-audit-table) and [implementation-audit.md](../architecture/implementation-audit.md). Snapshot date: 2026-10-26.

### 2.1 Summary findings

| Finding                         | Evidence                                                     | Implication                                   |
| ------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| One manuscript ≈ one `.md` file | `library.rs` `write_library_markdown`, `walk_markdown_files` | Multi-doc = new manifest, not just UI         |
| Library root in app config      | `library.json` in app config dir                             | Project path ≠ library path today             |
| No Git / no SQLite in app       | `Cargo.toml` deps; repo grep                                 | Greenfield integration                        |
| Autosave + recovery             | `ManuscriptPersistence`, `.scribo/recovery/`                 | Must coexist with Git commits—define ordering |
| No project entity               | `ManuscriptSummary` only                                     | New `@scribo/core` types needed               |
| Block IDs unstable on convert   | `blockId()` in `prosa-convert.ts:9`, `prosa-markdown.ts:6`   | Blocker for merge + workspace refs            |

### 2.2 Audit table

| Area              | Verified current state                                              | Evidence                                       | Implication                                     |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Document model    | `ProsaDocument` with `schemaVersion`, `blocks[]` each with `id`     | `packages/document-model/src/prosa/types.ts`   | Canonical for Classic; maps to Markdown         |
| Persistence       | Library `.md` atomic write; legacy `manuscripts/{id}/document.json` | `atomic_io.rs`, `library.rs`, `persistence.rs` | Project layout replaces library-only            |
| Autosave          | Debounce 800ms, max wait 3s; revision counter                       | `manuscript-persistence.ts`                    | Git commit ≠ every keystroke                    |
| Recovery          | Sidecar JSON hashed by path key                                     | `library_recovery_path`, `recovery-policy.ts`  | Keep orthogonal to Git                          |
| Editor modes      | Shared `ProsaDocument` in React; Md via CodeMirror string           | `App.tsx`, `prosa-markdown.ts`                 | Commit snapshots should use normalized Markdown |
| Git/versioning    | **None**                                                            | No `git2` dep                                  | Spike required                                  |
| Project structure | **Library folder** only; no manifest                                | `LibraryConfig` in `library.rs:19-21`          | Introduce `scribo.project.json`                 |
| Database          | **None**                                                            | No SQLite                                      | Indexes optional later                          |
| External sync     | Documented out of scope                                             | `MASTERPLAN.md`, `RELIABILITY.md`              | Drive/iCloud = **High** conflict risk           |
| Tests             | Vitest persistence/markdown; Rust `library.rs` tests                | `manuscript-persistence.test.ts`               | Extend for Git/project                          |

---

## 3. Requirements and invariants

| Invariant                                                          | Verification                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| No silent loss of authored content                                 | Integration tests: interrupt write, failed commit, failed merge; user-visible error |
| Single authority per data category                                 | Spec rules §6; lint/review; no duplicate prose in SQLite                            |
| Displayed doc matches last successful save or explicit dirty state | Existing save-state UI + new Git state machine                                      |
| Branch switch/merge explicit                                       | UI confirmation; `pre-branch` commit or stash                                       |
| Schema evolution explicit                                          | `scribo.project.json` `schemaVersion`; migrations in Rust + TS                      |
| Git history ≠ recovery sidecar                                     | Document lifecycle in §14                                                           |
| Unsupported concurrent access fails safe                           | Detect external mtime / Git index mismatch; no silent merge with open editor        |

**Non-goals (this program):** Multi-user real-time collaboration; safe Google Drive concurrent editing; replacing Git with custom DAG; full PM suite.

---

## 4. Architecture options compared

| Criterion            | A. Flat library + snapshot revisions (old spec) | B. Project dir + Git (recommended) | C. Monolithic `.scribo` SQLite blob  |
| -------------------- | ----------------------------------------------- | ---------------------------------- | ------------------------------------ |
| Integrity / recovery | Medium (linear checkpoints)                     | **High** (Git + atomic files)      | Medium (single-file corruption risk) |
| Branching / merges   | Poor                                            | **Native**                         | Poor                                 |
| Multi-document       | Ad hoc folders                                  | **Manifest-driven**                | Possible but opaque                  |
| Git compatibility    | N/A                                             | **Native**                         | Requires export                      |
| Performance          | Good                                            | Good (file granularity)            | Large-file rewrite cost              |
| Implementation cost  | Low (partially drafted)                         | **High**                           | Medium-high                          |
| Portability          | `.md` only                                      | `.md` + `.git` or package          | Single file                          |
| Drive sync           | Risky                                           | **Risky** (document §16)           | **Critical** risk                    |

**Recommendation:** **B** — project directory + Git for all authored content and manifest; `.scribo` as optional export. **Sacrifices:** implementation complexity, mandatory migration from library-only users, ID stability work upfront.

**Could change recommendation if:** Git spike fails packaging on macOS/Tauri, or ID stability proves intractable without full editor rewrite.

---

## 5. Proposed architecture

### 5.1 Prosa home vs project folder (Recommended)

```text
Documents/Scribo Prosa/           # Prosa home (default; may hold many projects)
├── My Novel/                     # Project folder (Git root + manifest)
│   └── …                         # See tree below
├── Essays/
└── …
```

Legacy/transitional: app config may still point at a single folder that acts as both home and one project until migration completes.

### 5.2 Project directory tree (Recommended)

```text
MyNovel/                          # User-facing project root (also Git root)
├── .git/                         # Version history (authoritative for tracked files)
├── scribo.project.json           # Project manifest (tracked)
├── content/
│   ├── manuscripts/
│   │   ├── novel/
│   │   │   ├── _manuscript.json  # Metadata, entity ids, order (tracked)
│   │   │   ├── ch-01.md          # Scene/chapter files (tracked)
│   │   │   └── ch-02.md
│   │   └── notes/
│   │       └── research-brief.md
│   └── assets/                   # Large binaries — Git LFS or gitignored + sidecar
├── workspace/                    # Optional tracked JSON
│   ├── tasks.json
│   ├── issues.json
│   └── milestones.json
├── knowledge/                    # Entities, sources (tracked JSON)
│   └── entities.json
└── .scribo/                      # App-local, **not** in Git (or gitignored)
    ├── index.sqlite              # Rebuildable search/backlinks
    ├── recovery/                 # Crash recovery
    └── ui-state.json             # Panel layout, last cursor (optional)
```

### 5.3 Component responsibilities

| Component                    | Owns                                      | Must not                     |
| ---------------------------- | ----------------------------------------- | ---------------------------- |
| `@scribo/document-model`     | Schema, validation, serialization         | Git, FS, React               |
| `@scribo/core`               | IDs, project/manuscript **types**, errors | I/O                          |
| Rust `project/` module (new) | Manifest I/O, Git ops, migrations         | UI                           |
| Rust `library.rs` (evolve)   | Back-compat import from legacy library    | Duplicate Git logic          |
| React app                    | Editor, writer UI, invoke Git as verbs    | Direct filesystem            |
| Git                          | Content history, branches, merges         | Semantic prose understanding |
| SQLite                       | Derived indexes                           | Authoritative prose          |

### 5.4 Source-of-truth rules

| Data                       | Authority                     | Versioned in Git?    |
| -------------------------- | ----------------------------- | -------------------- |
| Prose (Markdown)           | `content/**/*.md`             | Yes                  |
| Manuscript structure / IDs | `_manuscript.json` + manifest | Yes                  |
| Project manifest           | `scribo.project.json`         | Yes                  |
| Workspace tasks/issues     | `workspace/*.json`            | Yes (optional track) |
| Knowledge entities         | `knowledge/*.json`            | Yes                  |
| Search index               | `.scribo/index.sqlite`        | No (rebuild)         |
| Recovery                   | `.scribo/recovery/`           | No                   |
| App preferences            | Tauri app config              | No                   |

**Rule:** No prose in SQLite; no Git objects without working tree files for primary content.

### 5.5 Stable identity (Recommended)

- **ProjectId**, **ManuscriptId**, **DocumentId** — UUID in manifest (`@scribo/core`).
- **BlockId** — stable across saves; assigned at creation, preserved in Markdown via HTML comments or `.md` front-matter map (`<!-- scribo:id=blk_... -->`) **Assumption—spike needed**.
- **Scene/chapter** — first-class entries in `_manuscript.json` pointing to file paths.
- Workspace references store `{ entityId, anchor? }` not line numbers alone.

### 5.6 Package boundaries

New package **`@scribo/project-model`** (Recommended) for manifest + workspace types—only when manifest stabilizes; until then types in `@scribo/core`.

---

## 6. Git integration and versioning policy

### 6.1 Git provides vs Scribo must build

| Capability             | Git | Scribo layer                             |
| ---------------------- | --- | ---------------------------------------- |
| Commits, DAG, branches | Yes | Writer labels, autosave→commit policy    |
| Text diff              | Yes | Section/scene aggregation UI             |
| Merge three-way        | Yes | Prose conflict UI, structure-aware hints |
| Semantic “scene moved” | No  | Optional diff enricher                   |
| Schema migration       | No  | Rust migration + commit message          |

### 6.2 Integration approach (Recommended pending spike)

| Approach             | Pros                                   | Cons                             |
| -------------------- | -------------------------------------- | -------------------------------- |
| **`git2` (libgit2)** | Embedded, no user Git install          | libgit2 dep, AGPL linking review |
| **Shell `git`**      | Familiar                               | Packaging, sandbox, Windows PATH |
| **Hybrid**           | Init/status via libgit2; merge via CLI | Two code paths                   |

**Recommend:** Start spike with **`git2`**; fall back to CLI for merge if libgit2 merge insufficient.

### 6.3 Commit policy (Recommended)

- **Autosave** → working tree files (atomic write).
- **Auto-commit** optional: e.g. every N minutes of idle after save, or explicit “Checkpoint” / “Commit” with message.
- **Never commit** failed/incomplete atomic writes.
- **Branch** = alternate narrative line; **tag** = milestone/release marker.

---

## 7. Branching, merge, conflicts

- **Switch branch:** require clean working tree or explicit stash commit (`scribo-stash/*` branch **Assumption**).
- **Merge:** Git merge with conflict markers in `.md`; UI for accept/keep both for prose paragraphs.
- **Delete branch:** Git delete; warn if workspace refs point to branch-only entities.
- **Rename/move file:** Git mv + update manifest in same commit.

---

## 8. SQLite responsibilities

Rebuildable from Git + manifest:

- Full-text search index
- Backlinks (workspace → manuscript)
- Entity occurrence cache

Rebuild command: `scribo reindex` (Tauri) wipes and repopulates `.scribo/index.sqlite`.

---

## 9. Attachments

- Store under `content/assets/`; **Git LFS** or gitignore + manifest hash + external copy (**Decision pending**).
- Max size limits; never inline megabytes in SQLite.

---

## 10. Schema version and migration

- `scribo.project.json`: `projectSchemaVersion`, `appMinVersion`.
- Migrations: Rust entrypoint `migrate_project(path)` run before open; backup branch commit first.
- Legacy library: detect flat `.md` folder → wizard creates project + initial commit.

---

## 11. Autosave, transactions, recovery

| Step                   | Behavior                                       |
| ---------------------- | ---------------------------------------------- |
| Edit                   | In-memory `ProsaDocument` / Md string          |
| Autosave timer         | Atomic write to working tree                   |
| Recovery sidecar       | Optional until Git commit acknowledges         |
| Commit                 | Git index add + commit object                  |
| Crash mid-atomic-write | Previous file intact (`atomic_io.rs`)          |
| Crash mid-commit       | Git may leave index dirty; repair on next open |

---

## 12. Import, export, `.scribo` package

- **Export package:** zip(project tree) or git bundle + manifest checksum.
- **Import:** validate schema, optional clone as new project id.
- **Plain Markdown export:** unchanged—current manuscript only.

---

## 13. Local-first and Google Drive / cloud folders

**Verified:** No Drive integration in code.

**Recommended policy:**

- Projects **may** live in synced folders at user risk.
- Scribo **must not** claim safe multi-device concurrent edit via Drive.
- Detect index lock / mtime races; prompt reload or copy-out.
- Premium sync (future) = separate protocol with conflict rules—not Drive file polling alone.

**Risk: High** for Git repos in Drive (`.git` corruption).

---

## 14. Rust / TypeScript boundaries

New Tauri commands (illustrative):

- `open_project`, `list_manuscripts`, `git_status`, `git_commit`, `git_branch_*`, `git_merge_*`, `git_log`, `git_diff`

TypeScript: project shell, contextual workspace panel, no direct Git.

---

## 15. Security and privacy

- Projects local; no telemetry required.
- Git history contains all committed prose—warn on shared repos.
- AGPL applies to app code; user content is user-owned.

---

## 16. Testing and acceptance criteria

- Migration golden paths (legacy library → project).
- Git spike tests (see feasibility plan).
- Property: atomic write + commit never leaves zero-byte manuscript.
- Merge conflict fixtures (two branches edit same paragraph).

---

## 17. Alternatives considered

- Linear `.scribo/revisions/` ([revision-history-v1.md](./revision-history-v1.md)) — simpler but no real branches; **superseded**.
- Single SQLite document blob — rejected (§4).
- CRDT/real-time — out of scope.

---

## 18. Open questions (approval required)

1. Markdown + sidecar JSON vs Prosa JSON on disk for scenes?
2. Git LFS vs gitignored assets?
3. Auto-commit default on or off?
4. Project root = Git root always, or nested repos?
5. libgit2 vs CLI (post-spike).

---

## 19. Relationship to plan 003 features

| 003 capability    | Under plan 005                               |
| ----------------- | -------------------------------------------- |
| Revision history  | **Git** commits + writer UI                  |
| Research library  | `knowledge/` + Git                           |
| Analysis          | Indexes + non-mutating overlays; modes in UI |
| Project knowledge | `knowledge/entities.json` + stable IDs       |

Philosophy unchanged; **storage and VCS are the new foundation**.
