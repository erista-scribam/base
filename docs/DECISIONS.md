# Architectural decisions & known limitations

## Decisions

1. **Canonical model vs editor** — Prosa manuscripts are defined by `@scribo/document-model`, not TipTap/ProseMirror JSON. TipTap is an editing surface with conversion at the app boundary.
2. **Monorepo scope** — Only `@scribo/core` and `@scribo/document-model` exist initially; other packages from the master plan are deferred until needed.
3. **Persistence in Rust** — Saves go through Tauri commands and the filesystem API, not the frontend FS plugin, to keep I/O out of React and simplify permissions.
4. **Typography** — Manuscript presentation uses global CSS variables (`manuscript.css`), separate from editor chrome theme variables in `globals.css`.
5. **Structured editor** — TipTap StarterKit is trimmed (no code blocks, no arbitrary horizontal rules); scene breaks are a dedicated block node (`Mod-Shift-S` inserts a scene break).
6. **Recovery** — Autosave writes both `document.json` and `recovery.json`; opening a manuscript prefers `recovery.json` when present after a crash.
7. **pnpm hoisting** — Root `.npmrc` uses `node-linker=hoisted` so Vite 8 / Rolldown resolves TipTap and ProseMirror packages reliably in the workspace.

## Known limitations (milestone 1)

- No DOCX/PDF/Markdown import or export.
- Blockquotes flatten to a single inline run (multi-paragraph quotes not modeled yet).
- No pagination, print preview, or export profiles.
- No cloud sync, accounts, or collaboration.
- Rust toolchain was not available in the initial setup environment; desktop builds require local Rust + platform prerequisites.
- shadcn/ui is not wired yet; UI uses Tailwind utility classes only.
- Document block IDs are regenerated on each TipTap → model conversion (stable block IDs are a follow-up).
