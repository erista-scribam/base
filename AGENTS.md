# Instructions for AI coding agents

Scribo Prosa is a local-first Tauri desktop writing app. Follow this file before changing code or docs.

## Non-negotiables

- Read [docs/product/philosophy.md](docs/product/philosophy.md) and [docs/product/invariants.md](docs/product/invariants.md).
- Persistence, recovery, and schema changes require explicit failure-mode thinking and tests.
- Analysis and annotations must not silently mutate manuscript content.
- Do not commit secrets, real user manuscripts, or credentials.
- Run the right verification before handoff (see below).

## Repository layout

| Path                      | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `apps/prosa`              | React UI, editors, Tauri invoke adapters     |
| `apps/prosa/src-tauri`    | Rust persistence, library, commands          |
| `packages/core`           | IDs, metadata types                          |
| `packages/document-model` | Canonical `ProsaDocument` schema             |
| `docs/product/`           | Philosophy, roadmap, invariants              |
| `docs/architecture/`      | System overview, ADRs, implementation audit  |
| `docs/engineering/`       | Operating model, baseline, release, testing  |
| `docs/specs/`             | Behavioral contracts for risky features      |
| `docs/plans/active/`      | Approved or in-progress implementation plans |
| `docs/issues/written/`    | Written issue bypass lists                   |
| GitHub Issues             | Public bugs/features — see `docs/issues/github.md` |

Canonical index: [docs/README.md](docs/README.md).

## Commands

```bash
pnpm install
pnpm verify          # JS: format, lint, typecheck, test, Prosa build
pnpm verify:all      # verify + Rust fmt, clippy, check
pnpm tauri:dev       # Desktop app (Rust required)
pnpm changeset       # When a release note is needed
```

Touch Rust → `pnpm verify:all`. Docs-only → `pnpm format:check` at minimum.

## Workflow

1. **Operating model:** [docs/engineering/operating-model.md](docs/engineering/operating-model.md)
2. **Nontrivial features:** Plan in `docs/plans/active/<name>.md`; do not implement until the maintainer approves.
3. **Risky behavior:** Spec in `docs/specs/`; consequential choices → ADR in `docs/architecture/decisions/`.
4. **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

## Document model

- Authoritative types live in `@scribo/document-model`.
- TipTap and CodeMirror are adapters; do not treat editor JSON as canonical.
- Library manuscripts persist as Markdown on disk; Classic editing uses `ProsaDocument` in memory.

## Persistence

- Frontend: `apps/prosa/src/features/persistence/manuscript-persistence.ts` (debounced save, revision counter).
- Rust: `library.rs`, `persistence.rs`, commands in `lib.rs`.
- Do not bypass Tauri for filesystem writes from the webview.

## Human approval required

- License or legal text changes
- CI/release workflow changes that publish artifacts
- Schema migrations without a spec and tests
- New Tauri permissions or network integrations
- Deleting or rewriting historical ADRs (supersede instead)

## Uncertainty

If docs and code disagree, investigate and fix explicitly. Label unverified behavior in PRs and plans. Do not invent historical rationale for ADRs.
