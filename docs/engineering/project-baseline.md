# Project baseline (opening balance)

**Baseline date:** 2026-10-26  
**Git commit:** `637c0d3501055590157082134eab608d72f0ac99`  
**Branch:** `development` (synced with remote at baseline recording)  
**App version:** `@scribo/prosa` 0.4.0 (workspace fixed group)

This snapshot marks adoption of the [operating model](./operating-model.md). The workflow applies **prospectively** from this date. Prior commits and releases remain the historical record; no retroactive issues or PRs were created for past work.

---

## Product state (documented)

**Verified** where noted; otherwise **documented** from release notes and codebase inspection.

Scribo Prosa is a local-first Tauri desktop app for prose manuscripts. Product direction: **IDE-like shell affordances**, **writing-first** scope, **not an IDE fork** (OSS libraries only), **Prosa home** containing **project folders**—see [prosa-shell-and-projects.md](../product/prosa-shell-and-projects.md).

| Area                                        | State           | Evidence                                             |
| ------------------------------------------- | --------------- | ---------------------------------------------------- |
| Library folder + `.md` manuscripts          | Implemented     | `library.rs`, library UI                             |
| Classic structured editor (TipTap)          | Implemented     | `EditorWorkspace`                                    |
| Markdown source mode + preview              | Implemented     | CodeMirror, `prosa-markdown`                         |
| Autosave + recovery sidecars                | Implemented     | `ManuscriptPersistence`, `.scribo/recovery`          |
| External file change warning                | Implemented     | `App.tsx`, disk revision                             |
| Library sidebar (views, delete, timestamps) | Implemented     | Recent feature work                                  |
| Revision history (user-facing)              | **Not started** | Spec draft only                                      |
| DOCX/PDF export                             | Not implemented | [known-limitations](../product/known-limitations.md) |
| Cloud sync / accounts                       | Not implemented | By design                                            |

---

## Architecture (verified)

- pnpm monorepo: `apps/prosa`, `packages/core`, `packages/document-model`, Rust in `apps/prosa/src-tauri`.
- Canonical model: `@scribo/document-model`; see [data-model.md](../architecture/data-model.md).
- Overview: [system-overview.md](../architecture/system-overview.md).
- Implementation map: [implementation-audit.md](../architecture/implementation-audit.md).

---

## Verification at baseline

| Check                    | Command            | Result (2026-10-26)                   |
| ------------------------ | ------------------ | ------------------------------------- |
| Full JS + build          | `pnpm verify`      | **Verified** pass                     |
| Rust fmt, clippy, check  | `pnpm verify:rust` | **Verified** pass                     |
| Desktop bundle           | `pnpm tauri:build` | **Not verified** in this baseline run |
| Install from release DMG | Manual             | **Unknown**                           |

Test coverage: Vitest in `document-model`, `prosa` (persistence, markdown). Rust unit tests in `library.rs`. **Not audited:** exhaustive editor E2E, all platforms.

---

## Risks and unverified areas

- Stable block IDs across TipTap conversion (**documented** gap).
- Multi-paragraph blockquotes in model (**documented**).
- Large-manuscript performance (**not audited**).
- Windows/Linux desktop builds (**not verified** at baseline).

---

## Open work at adoption

See [product/roadmap.md](../product/roadmap.md). **Plan 003 deep features are not implemented**—only strategy docs and a revision-history spec draft. Next code target: **Revision History v1** after spec/plan approval.

---

## Public-readiness checklist (plan 004 §12)

| Item                                                                  | Status                                           |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| LICENSE (AGPL-3.0-or-later) + [licensing.md](../product/licensing.md) | **Done**                                         |
| README + build instructions                                           | **Done** (review before announce)                |
| CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT                      | **Done**                                         |
| AGENTS.md                                                             | **Done**                                         |
| Issue / PR templates                                                  | **Done**                                         |
| CI on `main` / `development`                                          | **Verified** (`.github/workflows/ci.yml`)        |
| Dependabot                                                            | **Documented** (`.github/dependabot.yml`)        |
| Branch protection / required checks                                   | **Maintainer** — configure on GitHub when public |
| Replace placeholder org URLs                                          | **Done** (generic GitHub wording)                |
| Privacy-safe fixtures only                                            | **Policy** — enforce in reviews                  |

---

## Baseline update policy

Do not rewrite this file for every release. Append a dated **Audit findings** section if a material discrepancy is discovered. Ongoing truth lives in canonical docs, tests, and Git.
