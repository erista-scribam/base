# Prosa shell, IDE affordances, and project storage

**Status:** Active product direction  
**Authority:** [philosophy.md](./philosophy.md) · **Execution:** [plan 006](../plans/active/006-scribo-lanista-platform.md) (005 paused)

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

| Layer                   | Role                                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scribo Lanista home** | Default platform root on disk (e.g. `Documents/Scribo/` — name TBD). Holds **multiple** projects; **Lanista** is the app that creates, lists, and opens them.                                                           |
| **Project folder**      | One subdirectory per project. Contains `scribo.project.json`, `content/manuscripts/` (Prosa), optional future subtrees for other apps. See [lanista-platform-and-storage.md](../specs/lanista-platform-and-storage.md). |
| **Scribo Prosa**        | Satellite writing app; may only access **`content/manuscripts/`** inside an opened project (filesystem grants). Launched from Lanista with a capability grant.                                                          |
| **App config**          | **Lanista** owns catalog/recents; Prosa holds session/editor state—not authoritative manuscripts.                                                                                                                       |

User-facing mental model (target): **open Lanista → pick or create a project → open in Prosa** to write. Prosa keeps IDE-like navigation **inside** the granted manuscript tree—not as the platform hub.

### Current implementation (transitional)

Today `library.json` may point **directly** at a single project root (the home folder and the active project can be the same path). Catalog and “Open project” already support **multiple** project directories via `scribo.project.json` discovery and recents. **Convergence work:** treat `Documents/Scribo Prosa/` as the default **home**, create new projects as **child folders**, and migrate legacy layouts where manuscripts lived at the home root into `content/manuscripts/` inside a named project folder.

---

## 4. Related decisions

- **Local-first, Git as engine:** Writer-visible checkpoints and diffs **per manuscript** (not project-wide). Plan [006](../plans/active/006-scribo-lanista-platform.md).
- **Future sync:** “GitHub for writing” spinoff mirrors on-disk projects—Phase 9 in [project-architecture-roadmap.md](../plans/active/project-architecture-roadmap.md)—does not replace the home + project folder layout.

---

## Related documents

| Document                                                                                  | Role                          |
| ----------------------------------------------------------------------------------------- | ----------------------------- |
| [philosophy.md](./philosophy.md)                                                          | Product law                   |
| [invariants.md](./invariants.md)                                                          | Portability and on-disk rules |
| [specs/project-architecture-and-storage.md](../specs/project-architecture-and-storage.md) | Project tree and Git          |
| [architecture/system-overview.md](../architecture/system-overview.md)                     | Code layers                   |
