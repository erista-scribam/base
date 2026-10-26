# `.mdprosa` format v1 (stub)

**Status:** Draft — Phase A gate for [plan 006](../plans/active/006-scribo-lanista-platform.md)

## Intent

Define the on-disk Scribo prose format (extension `.mdprosa`), version field, stable block IDs, and round-trip rules with `@scribo/document-model`.

## v1 baseline (proposal)

- Start from current normalized Markdown + HTML comment block anchors (Phase 1).
- Required `scribo-format-version` in YAML front matter or equivalent header.
- Package home: `@scribo/mdprosa` (name TBD in ADR).

## Open questions

- Single file vs multi-file manuscript packages.
- Compatibility subset for external tools (export-only CommonMark).

**No library saves as `.mdprosa` in production until this spec is approved.**
