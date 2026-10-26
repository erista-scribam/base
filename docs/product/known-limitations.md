# Known limitations

**Status:** Living document (product-facing gaps)

Not an exhaustive bug list—see GitHub Issues for active defects once the repo is public.

## Export and interchange

- No DOCX/PDF pipeline or export profiles.
- Library import/open for external `.md`; no full import/export product suite.

## Editor model

- Blockquotes flatten to a single inline run (multi-paragraph quotes not modeled yet).
- Document block IDs may be regenerated on TipTap → model conversion (stable IDs follow-up).
- No pagination or print preview.

## Platform and UI

- Desktop-focused (Tauri); no web or mobile product surfaces.
- shadcn/ui not wired; chrome uses custom CSS.
- Cloud sync, accounts, and collaboration not implemented.

## Tooling

- Desktop release builds require local Rust and platform prerequisites.
- CI validates JS + Rust checks on Ubuntu; macOS/Windows release builds use separate workflow.

When a limitation is removed, update this file and the changelog.
