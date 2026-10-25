# Contributing to Scribo

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 10.x (see root `packageManager` field)
- [Rust](https://www.rust-lang.org/tools/install) and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for desktop development

## Setup

```bash
pnpm install
```

## Commands

| Command | Description |
| --- | --- |
| `pnpm typecheck` | TypeScript across workspaces |
| `pnpm test` | Vitest (document model) |
| `pnpm lint` | ESLint |
| `pnpm format:check` | Prettier |
| `pnpm dev` | Vite frontend only (`@scribo/prosa`) |
| `pnpm tauri:dev` | Desktop app (requires Rust) |
| `pnpm tauri:build` | Production desktop build |

## Conventions

- Strict TypeScript; avoid `any`.
- Domain logic belongs in `packages/`, not React components.
- Do not duplicate the document schema outside `@scribo/document-model`.
- Keep Tauri permissions minimal; add native commands deliberately.
- Run `pnpm typecheck` and `pnpm test` before opening a PR.

See `MASTERPLAN.md` and `docs/ARCHITECTURE.md` for product and layering rules.
