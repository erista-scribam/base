# Contributing to Scribo

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 10.x (see root `packageManager` field)
- [Rust](https://www.rust-lang.org/tools/install) and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for desktop development

## Setup

```bash
pnpm install
pnpm hooks:install   # optional: enable .githooks/pre-commit
```

## Branching

- Base feature branches on **`development`** and open PRs into **`development`**.
- Add a **changeset** when the PR should appear in the next release: `pnpm changeset` (see `.changeset/README.md`).
- Release by merging **`development` → `main`**; Changesets opens a **Version packages** PR and tags `vX.Y.Z` when merged (see `docs/RELEASE.md`).

Details: `docs/VERSION_CONTROL.md`.

## Commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm changeset`    | Add a release note for the next semver bump    |
| `pnpm verify`       | CI-equivalent JS checks + Prosa frontend build |
| `pnpm verify:all`   | `verify` plus Rust fmt, Clippy, and check      |
| `pnpm typecheck`    | TypeScript across workspaces                   |
| `pnpm test`         | Vitest (document model)                        |
| `pnpm lint`         | ESLint                                         |
| `pnpm format:check` | Prettier                                       |
| `pnpm dev`          | Vite frontend only (`@scribo/prosa`)           |
| `pnpm tauri:dev`    | Desktop app (requires Rust)                    |
| `pnpm tauri:build`  | Production desktop build                       |

## Conventions

- Strict TypeScript; avoid `any`.
- Domain logic belongs in `packages/`, not React components.
- Do not duplicate the document schema outside `@scribo/document-model`.
- Keep Tauri permissions minimal; add native commands deliberately.
- Run `pnpm verify` (or `pnpm verify:all` if you touched Rust) before opening a PR.

See `MASTERPLAN.md` and `docs/ARCHITECTURE.md` for product and layering rules.
