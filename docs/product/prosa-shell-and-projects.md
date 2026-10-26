# Prosa shell, IDE affordances, and project storage

**Status:** Active product direction  
**Authority:** [philosophy.md](./philosophy.md) · **Execution:** [plan 005](../plans/active/005-project-workspace-and-git.md)

This document states how Scribo Prosa relates to “IDE-like” software, what we are **not** building, and where projects live on disk.

---

## 1. IDE-like affordances, writing app first

We **converge on IDE-style interaction** where it helps long-form work: project sidebar, file tree, editor tabs, source-control panel, side-by-side diffs, resizable chrome. Writers juggling many markdown manuscripts benefit from the same spatial habits developers use—without redefining the product as a code editor.

**Scribo Prosa remains a writing app first.** The center of gravity is prose: drafting, structure, revision, checkpoints, and trust—not syntax highlighting ecosystems, debuggers, or repo tooling for its own sake. IDE patterns are **presentation and navigation**; the [philosophy](./philosophy.md) feature gate and final test still apply to every change.

---

## 2. We are not forking or shipping an IDE

Scribo Prosa is **not** a fork of VS Code, Cursor, Zed, or any full IDE. We do **not** embed another editor shell or chase IDE feature parity.

We **reuse open-source components and libraries** where they fit our stack and license (examples today: **libgit2** via the `git2` crate for Git; **CodeMirror** for Markdown source; **TipTap** for structured prose). Those are building blocks under **our** React + Tauri application, writer-oriented UI, and product law—not a rebranded IDE.

---

## 3. Scribo Prosa home and projects as folders

### Target model

| Layer                 | Role                                                                                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scribo Prosa home** | Default app root on disk (e.g. `Documents/Scribo Prosa/`). Holds **multiple** writing projects and is the normal place new work is created.                                                                                                              |
| **Project folder**    | One subdirectory per project (e.g. `Documents/Scribo Prosa/My Novel/`). Contains `scribo.project.json`, `content/`, optional `.git/`, `.scribo/` recovery, etc. See [project-architecture-and-storage.md](../specs/project-architecture-and-storage.md). |
| **App config**        | Tauri app config (e.g. `library.json`) stores the **home path**, recent projects, and session state—not the authoritative copy of manuscripts.                                                                                                           |

User-facing mental model: **open Scribo Prosa → pick or create a project folder inside your Prosa home** (or another allowed location), same as opening a folder in an IDE—but the folder is a **writing project**, not a code repository template.

### Current implementation (transitional)

Today `library.json` may point **directly** at a single project root (the home folder and the active project can be the same path). Catalog and “Open project” already support **multiple** project directories via `scribo.project.json` discovery and recents. **Convergence work:** treat `Documents/Scribo Prosa/` as the default **home**, create new projects as **child folders**, and migrate legacy layouts where manuscripts lived at the home root into `content/manuscripts/` inside a named project folder.

---

## 4. Related decisions

- **Local-first, Git as engine:** Writer-visible checkpoints and diffs; not raw Git porcelain. Plan [005](../plans/active/005-project-workspace-and-git.md).
- **Future sync:** “GitHub for writing” spinoff mirrors on-disk projects—Phase 9 in [project-architecture-roadmap.md](../plans/active/project-architecture-roadmap.md)—does not replace the home + project folder layout.

---

## Related documents

| Document                                                                                  | Role                          |
| ----------------------------------------------------------------------------------------- | ----------------------------- |
| [philosophy.md](./philosophy.md)                                                          | Product law                   |
| [invariants.md](./invariants.md)                                                          | Portability and on-disk rules |
| [specs/project-architecture-and-storage.md](../specs/project-architecture-and-storage.md) | Project tree and Git          |
| [architecture/system-overview.md](../architecture/system-overview.md)                     | Code layers                   |
