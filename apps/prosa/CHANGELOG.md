# @scribam/prosa

## 0.4.0

### Minor Changes

- 92638cd: Polish Markdown mode for day-to-day writing (iA-style source editor).

  ### Editor & toolbar
  - Text cursor across the markdown workspace; formatting toolbar parity with Classic (bold, italic, strike, code, headings, lists, quote, code fence, scene break).
  - Enter starts a plain paragraph (no automatic `>` or list continuation on the next line).
  - Improved spacing after blockquotes and between block types.

  ### Reading & navigation aids
  - Active sentence highlight at the caret.
  - Dialog in straight or curly double quotes uses a subtle accent text color (`--scribam-md-dialog-fg`).
  - Find panel (⌘F): Find and Replace rows with next/previous, match case, Replace, and Replace all.

  ### Layout & persistence
  - Line length presets: Small / Medium / Large / Very large / Full width (full width uses the pane, not the old manuscript column cap).
  - Library saves run markdown source normalization (trim trailing spaces, collapse extra blank lines).

### Patch Changes

- @scribam/core@0.4.0
- @scribam/document-model@0.4.0

## 0.3.1

### Patch Changes

- 6dc65ef: Fix library manuscript title saves so renaming the title in the editor renames the `.md` file on disk and keeps the active manuscript in sync.
  - @scribam/core@0.3.1
  - @scribam/document-model@0.3.1

## 0.3.0

### Minor Changes

- bf156fd: Markdown writing and library release (fixed bump with `@scribam/core` and `@scribam/document-model`):

  **Markdown mode** — Split source editor (CodeMirror) with Preview / Sections side panel; Classic ↔ Markdown sync; one source line = one paragraph; Shift+Enter hard break; line length 64 / 72 / 80 / full width; editor zoom 85–135% (toolbar and ⌘+ / ⌘− / ⌘0).

  **Navigation** — iA-style keys in markdown source: wrapped-line ↑/↓; Ctrl+↑/↓ for source lines; Alt+↑/↓ for wrap boundaries; ⌘←/→ line start/end; ⌘↑/↓ section start/end (headings and scene breaks).

  **Sections panel** — Outline of headings, scene breaks, and passages; caret sync and click-to-jump in source; same section rules as ⌘↑/↓.

  **Library & persistence** — Save manuscripts as `.md` under Documents/Scribam Prosa; Finder reveal; legacy storage migration; autosave, recovery, and clearer on-disk change handling.

  **Polish** — UI overhaul (library, focus mode, themes); centered scene breaks and dark-mode break styling; scroll padding at end of document; markdown preview from live source; document repair/coercion for import; list, code, and Classic/Markdown sync fixes.

### Patch Changes

- @scribam/core@0.3.0
- @scribam/document-model@0.3.0

## 0.2.0

### Minor Changes

- Markdown writing mode: split source editor with CodeMirror, live preview toggle, column ruler, and Classic ↔ Markdown sync. Library manuscripts save as `.md` under Documents/Scribam Prosa with Finder reveal, legacy app-data migration, debounced autosave, recovery snapshots, and fewer false “changed on disk” / recovery prompts. Editor zoom (85–135%, toolbar and ⌘+/⌘−/⌘0) for Classic and Markdown, persisted locally.

### Patch Changes

- @scribam/core@0.2.0
- @scribam/document-model@0.2.0

## 0.1.0

### Minor Changes

- a9e3250: Initial Scribam Prosa release: pnpm monorepo, canonical Prosa document model, Tauri desktop shell, structured editor, global manuscript typography, local persistence, CI, and Changesets release automation.

### Patch Changes

- @scribam/core@0.1.0
- @scribam/document-model@0.1.0
