# Compatibility and version domains

**Status:** Active

Do not conflate these version concepts (see [product/invariants.md](../product/invariants.md)):

| Domain                 | Source                                   | Notes                                                       |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Application            | `@scribo/prosa` semver, git tags         | Changesets fixed group                                      |
| npm workspace packages | `@scribo/core`, `@scribo/document-model` | Same release train as app                                   |
| Manuscript schema      | `ProsaDocument.schemaVersion`            | Migrations in `@scribo/document-model`                      |
| Project metadata       | Future                                   | Not implemented                                             |
| Revision identity      | Future                                   | [revision-history-v1 spec](../specs/revision-history-v1.md) |

## Library files

- On-disk library manuscripts are **Markdown** (`.md`). Normalization on save is documented in code/tests.
- Sidecars under `.scribo/` are Scribo-specific; document changes when format changes.

## Breaking changes

- Require a spec or ADR, migration path, and changelog entry via Changesets.
- Binary rollback may not undo a data migration—define backup/recovery in the spec.

## Public API

Workspace packages are currently **private** (`"private": true`). If packages are published later, document semver policy here.
