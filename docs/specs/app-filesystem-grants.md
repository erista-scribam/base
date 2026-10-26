# App filesystem grants (stub)

**Status:** Draft — Phase A gate for [plan 006](../plans/active/006-scribam-lanista-platform.md)

## Intent

Define how Lanista grants path allowlists to satellite apps and how Rust Tauri commands enforce them.

## Minimum contract (proposal)

- Grant: `{ appId, projectRoot, allowedRelativePaths[] }`.
- Every path operation: resolve → canonicalize → verify `allowedRelativePaths` prefix rules.
- Stable error: `ERR_SCRIBAM_PATH_FORBIDDEN` with user message and optional “Open in Lanista” action.

## Prosa v1 allowlist

- **Read/write:** `content/manuscripts/**`
- **Read-only (TBD):** minimal fields from `scribam.project.json` for display only

## Tests required before ship

- Traversal attempts (`../`, symlinks if supported).
- Absolute path keys rejected unless explicitly granted dev mode.
