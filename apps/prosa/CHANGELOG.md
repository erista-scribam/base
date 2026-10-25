# @scribo/prosa

## 0.3.0

### Minor Changes

- bf156fd: Markdown writing and library release (fixed bump with `@scribo/core` and `@scribo/document-model`):

  **Markdown mode** — Split source editor (CodeMirror) with Preview / Sections side panel; Classic ↔ Markdown sync; one source line = one paragraph; Shift+Enter hard break; line length 64 / 72 / 80 / full width; editor zoom 85–135% (toolbar and ⌘+ / ⌘− / ⌘0).

  **Navigation** — iA-style keys in markdown source: wrapped-line ↑/↓; Ctrl+↑/↓ for source lines; Alt+↑/↓ for wrap boundaries; ⌘←/→ line start/end; ⌘↑/↓ section start/end (headings and scene breaks).

  **Sections panel** — Outline of headings, scene breaks, and passages; caret sync and click-to-jump in source; same section rules as ⌘↑/↓.

  **Library & persistence** — Save manuscripts as `.md` under Documents/Scribo Prosa; Finder reveal; legacy storage migration; autosave, recovery, and clearer on-disk change handling.

  **Polish** — UI overhaul (library, focus mode, themes); centered scene breaks and dark-mode break styling; scroll padding at end of document; markdown preview from live source; document repair/coercion for import; list, code, and Classic/Markdown sync fixes.

### Patch Changes

- @scribo/core@0.3.0
- @scribo/document-model@0.3.0

## 0.2.0

### Minor Changes

- Markdown writing mode: split source editor with CodeMirror, live preview toggle, column ruler, and Classic ↔ Markdown sync. Library manuscripts save as `.md` under Documents/Scribo Prosa with Finder reveal, legacy app-data migration, debounced autosave, recovery snapshots, and fewer false “changed on disk” / recovery prompts. Editor zoom (85–135%, toolbar and ⌘+/⌘−/⌘0) for Classic and Markdown, persisted locally.

### Patch Changes

- @scribo/core@0.2.0
- @scribo/document-model@0.2.0

## 0.1.0

### Minor Changes

- a9e3250: Initial Scribo Prosa release: pnpm monorepo, canonical Prosa document model, Tauri desktop shell, structured editor, global manuscript typography, local persistence, CI, and Changesets release automation.

### Patch Changes

- @scribo/core@0.1.0
- @scribo/document-model@0.1.0
