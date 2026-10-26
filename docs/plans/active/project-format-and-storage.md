# Plan — Project format and storage validation

**Status:** Draft — awaiting architectural review  
**Spec:** [multi-application-project-architecture.md](../../specs/multi-application-project-architecture.md)  
**Depends on:** Current Prosa implementation (`project.rs`, `library.rs`, `@scribo/core/project.ts`)

## Objective

Validate and specify the **project manifest**, **canonical content layout**, **format identification**, **schema versioning**, and **migration** from the verified v1 layout (`scribo.project.json` + `content/manuscripts/` + `.md`) to the multi-app v2 model (`contents/canon/*`, typed extensions, capabilities).

**Non-goals:** Implement Lanista, Folio, or Drama apps; run migrations on user machines.

---

## Verified baseline (v1)

| Artifact        | Location                      | Symbol / note                                    |
| --------------- | ----------------------------- | ------------------------------------------------ |
| Manifest        | `scribo.project.json`         | `PROJECT_MANIFEST_FILE`, `ScriboProjectManifest` |
| Manuscripts dir | `content/manuscripts`         | `CONTENT_MANUSCRIPTS_DIR`                        |
| Layout version  | `layoutVersion: 1`            | `PROJECT_LAYOUT_VERSION`                         |
| Prose files     | `*.md`                        | `is_markdown_file` in `library.rs`               |
| Recovery        | `.scribo/recovery/`           | `library_recovery_path`                          |
| App catalog     | `library.json` (Prosa config) | `LibraryConfig` with `home_path`, `root_path`    |

---

## Target (v2) — to validate in Phase A

| Topic           | Proposal                                                           | Validation activity                                               |
| --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Manifest        | `projectSchemaVersion: 2`, `apps.{prosa,folio,drama}` capabilities | JSON Schema draft + fixture round-trip                            |
| Tree            | `contents/canon/manuscripts`, `contents/shared/{research,assets}`  | Path constant table in `@scribo/project-model`                    |
| Prosa format    | `.mdprosa` + `scribo-format-version`                               | [mdprosa-format-v1.md](../../specs/mdprosa-format-v1.md) approval |
| Filename        | Keep `scribo.project.json` vs rename                               | ADR + migration alias read                                        |
| Unknown content | Preserve + skip                                                    | Migration fixture with extra files                                |

---

## Bounded work packages

### PFS-1 — Manifest schema draft

- Deliverable: JSON Schema + TypeScript types in `@scribo/project-model` (package may remain doc-only until approved).
- Acceptance: Parses verified v1 manifest; extends with optional `apps` block; unknown fields preserved.

### PFS-2 — Layout compatibility matrix

| From                  | To                             | Tool owner                             |
| --------------------- | ------------------------------ | -------------------------------------- |
| `content/manuscripts` | `contents/canon/manuscripts`   | Migration spec                         |
| `.md`                 | `.mdprosa`                     | Domain package + one-release dual-read |
| Flat files            | Manuscript packages (optional) | Defer unless Git ADR requires          |

- Acceptance: Documented idempotent steps in [layout-v2-migration.md](../../specs/layout-v2-migration.md) aligned with this plan.

### PFS-3 — Format identification rules

- Extension + manifest `documentTypes` must agree for writes.
- Acceptance: Table of MIME/extension/formatVersion per app; no write on mismatch.

### PFS-4 — Schema versioning policy

- Single doc: who bumps what (`projectSchemaVersion`, `layoutVersion`, `schemaVersion`, format version).
- Acceptance: Reviewer sign-off; linked from [invariants.md](../../product/invariants.md) version domains table.

### PFS-5 — Conformance tests (spec-only fixtures)

- Golden project folders in `docs/fixtures/projects/` (future) — **proposed**, not created in this task unless approved.
- Acceptance criteria defined even if fixtures land later.

---

## Migration strategy (planning)

1. **Read v1** indefinitely for one release cycle (dual-read).
2. **Write v2** only after user opt-in or Lanista migration wizard.
3. **Flag** on manifest: `migratedFromLayout: 1`.
4. **Block** partial migration (fail closed).

---

## Risks

| Risk                                         | Mitigation                                 |
| -------------------------------------------- | ------------------------------------------ |
| Renaming `content` → `contents` breaks paths | Adapter layer in Rust `resolve_canon_path` |
| Two manifest filenames                       | Read both; write canonical only            |
| Prosa-only users forced through Lanista      | Dev/prod mode ADR                          |

---

## Approval gate

No changes to `project.rs` / `library.rs` layout constants until **PFS-1–PFS-4** approved and recorded in pending ADRs.

---

## Related

- [project-git-strategy.md](./project-git-strategy.md)
- [multi-application-architecture-roadmap.md](./multi-application-architecture-roadmap.md)
- [006-scribo-lanista-platform.md](./006-scribo-lanista-platform.md)
