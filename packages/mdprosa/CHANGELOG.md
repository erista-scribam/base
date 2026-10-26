# @scribam/mdprosa

## 0.5.0

### Minor Changes

- e040bec: Scribam Prosa **0.5.0** — project workspace, embedded Git, and Scribam rebrand.

  ### Parent brand and platform
  - Rebrand the monorepo from **Scribo** to **Scribam** (`@scribam/*`, product copy, docs). Legacy on-disk paths (`Scribo Prosa`, `scribo.project.json`, `.scribo/`) remain readable via dual-read in the Rust library.
  - Add **Scribam brand kit** (marks, app icons, palette) and **MASTERPLAN §3** for reusable brand rules (marketing vs in-app typography).
  - Defer **Lanista** as a future paid hub; remove the experimental launcher app from the tree.

  ### Project workspace (plan 005)
  - **Project folders** with `scribam.project.json`, layout v2 migration, and manifest **apps** metadata via new **`@scribam/project-model`**.
  - **Filesystem grants** and project-scoped manuscript paths; explorer for project files and folders.
  - **Scribam Prosa home** under Documents with recent projects and embedded-project migration from legacy layouts.

  ### Version control
  - Embedded **Git** per project root: branches, checkpoints, working tree status, and **Source Control** sidebar.
  - **Commit graph** with lane layout; branch tips as inline badges on commit rows.
  - **Merge conflict** UI, branch switching, and **diff editor tabs** (including head-to-head compare).
  - Multi-tab editing scoped per project.

  ### Manuscripts and editors
  - **`@scribam/mdprosa`** package and **`.mdprosa`** persistence (dual-read legacy `.md`).
  - Editor modes renamed **Proper** and **Minimalist**; dismissible mdprosa format notice.
  - Stable **block IDs** across Proper ↔ markdown adapters; library filename/title fixes (including titles with parentheses).

  ### Library and shell
  - Manuscript library: delete, created/edited metadata, layout modes (compact, details, grid).
  - Resizable sidebar, project switcher, native window theme sync with in-app light/dark.
