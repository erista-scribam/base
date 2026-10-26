# Testing strategy

**Status:** Active

Tests are **correctness evidence**. When tests and docs disagree, resolve explicitly.

## Priorities

1. **Manuscript integrity** — persistence, autosave ordering, recovery, schema validation.
2. **Classic ↔ Markdown** — round-trip and normalization (`prosa-markdown`, `markdown-normalize`).
3. **Editor behavior** — add tests when fixing regressions (undo, paste, IME as needed).
4. **Future subsystems** — revision history, annotations: deterministic fixtures; prove analysis does not mutate content.

## Where tests live

| Area                   | Runner         | Location                              |
| ---------------------- | -------------- | ------------------------------------- |
| Document schema        | Vitest         | `packages/document-model`             |
| Markdown / persistence | Vitest         | `apps/prosa/src/features/**`          |
| Library / filenames    | Rust `#[test]` | `apps/prosa/src-tauri/src/library.rs` |

## Commands

```bash
pnpm test           # all workspace tests
pnpm verify         # format, lint, typecheck, test, Prosa build
pnpm verify:all     # + Rust fmt, clippy, check
```

Touch Rust persistence → run `pnpm verify:all`. CI runs the same split as `.github/workflows/ci.yml`.

## Fixtures

Use synthetic or minimal text—**never real private manuscripts** in the repo.

## Definition of done (testing)

- New persistence or migration paths include automated tests or a documented gap in the PR.
- Bug fixes should add a regression test when practical.

See [operating-model.md](./operating-model.md) and [product/invariants.md](../product/invariants.md).
