# Product invariants

**Status:** Active  
**Authority:** [PRODUCT_CONSTITUTION.md](./PRODUCT_CONSTITUTION.md)

These statements must remain true unless changed through an explicit document update and, when they affect persistence or schema, migration and tests. They combine reliability rules from [002-prosa-data-quality.md](./plans/002-prosa-data-quality.md) with writer-centred data rules from plan 003.

---

## Manuscript integrity

1. **Canonical model** — `@scribo/document-model` is the authoritative representation of manuscript _content_ for Classic editing; library manuscripts may additionally treat normalized Markdown as the on-disk source when in Markdown-first workflows.
2. **No silent loss** — The editor and persistence layer must not silently discard valid user content.
3. **Schema validity** — Every persisted document must validate for its declared schema version.
4. **Save honesty** — A successful save corresponds to a known revision; failed saves are never reported as success.
5. **Write ordering** — Older async saves must not overwrite newer committed revisions (per-manuscript serialization).
6. **Corruption** — Unsupported or corrupted documents must not be silently replaced with empty documents.
7. **Migration** — Schema migrations preserve content and metadata; failed migrations leave recoverable state.
8. **Analysis boundary** — Formatting annotations, highlights, and future linguistic analysis must not modify manuscript content except through explicit user edit operations.
9. **Blast radius** — Crash or failed background work must not silently corrupt unrelated manuscripts.

---

## Version domains (do not conflate)

| Domain                   | Examples                      | Notes                                                          |
| ------------------------ | ----------------------------- | -------------------------------------------------------------- |
| Application version      | `@scribo/prosa` semver        | Release cadence via Changesets                                 |
| Document schema version  | `ProsaDocument.schemaVersion` | Migrations in document-model                                   |
| Project metadata version | Future research/entity stores | Not yet implemented                                            |
| Revision identity        | Checkpoints, named versions   | Spec: [revision-history-v1.md](./specs/revision-history-v1.md) |

---

## Recovery and external change

Expected behavior (deterministic, tested where feasible):

| Scenario                          | Expected behavior                                                         |
| --------------------------------- | ------------------------------------------------------------------------- |
| Interrupted save                  | Last successful revision remains; recovery may offer newer in-memory work |
| Unexpected process exit           | Recovery snapshot available when autosave had pending work                |
| Disk full / permission error      | Save fails visibly; prior file unchanged                                  |
| Malformed on-disk document        | Load fails with clear error; no silent empty doc                          |
| External app edited library `.md` | User notified; reload is explicit                                         |
| Destructive delete                | Confirmed by user; recovery sidecar cleared with file                     |

---

## Classic ↔ Markdown

1. **Explicit adapters** — Conversion lives at the app boundary (`prosa-markdown`, TipTap adapter), not inside `@scribo/document-model`.
2. **Round-trip goal** — Common structures (headings, paragraphs, quotes, lists, scene breaks) round-trip without structural surprise; known gaps are documented in [DECISIONS.md](./DECISIONS.md).
3. **Normalize on save** — Library Markdown may be normalized on save for consistency; normalization must not remove meaningful content (see tests in `markdown-normalize`).

---

## Portability

1. **Library manuscripts** — Primary artifact is human-readable `.md` under a user-chosen library root.
2. **Extensions** — Scribo-specific sidecars (e.g. `.scribo/recovery`) must be documented and bounded.
3. **Export** — Future export must not require mutating the canonical manuscript.
4. **No opaque lock-in** — No storage format without a documented recovery or export path.

---

## Enforcement

- Invariants with persistence impact should have **automated tests** (Rust and/or Vitest).
- PRs that touch save, recovery, schema, or Classic/Markdown sync should cite which invariants they preserve or extend.
- See [ARCHITECTURE_AUDIT.md](./ARCHITECTURE_AUDIT.md) for current implementation mapping and gaps.
