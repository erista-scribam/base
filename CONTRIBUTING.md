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
- Release by merging **`development` → `main`**, then tag (see `docs/RELEASE.md`).

Details: `docs/VERSION_CONTROL.md`.

## Commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
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
