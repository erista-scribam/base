# Data model

**Canonical source:** `packages/document-model` — types, validation, and JSON serialization for `ProsaDocument`.

## Rules

- Manuscript **content** is defined by the document model, not TipTap or CodeMirror JSON.
- Schema version field drives migrations; see package tests and validators.
- Metadata summaries (`ManuscriptSummary`) live in `@scribam/core`.

## On disk (library)

- Primary artifact: **Markdown** file in the user library.
- Crash recovery: `.scribam/recovery/` (hashed by path key).
- Legacy internal manuscripts (if any): app data `manuscripts/{id}/document.json` + `meta.json`.

## Editing surfaces

| Mode     | Adapter                                 |
| -------- | --------------------------------------- |
| Classic  | TipTap → canonical model                |
| Markdown | CodeMirror source ↔ `prosa-markdown.ts` |

Round-trip guarantees and known gaps: [decisions/0001-canonical-model-vs-editor.md](./decisions/0001-canonical-model-vs-editor.md), [product/known-limitations.md](../product/known-limitations.md).
