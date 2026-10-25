# Scribo

Opinionated, structured writing software. **Scribo Prosa** is the first product: a local-first desktop app for prose manuscripts (novels, essays, memoir, and similar forms).

Scribo owns the **structure** of the writing; the application owns **presentation**.

## Repository layout

- `apps/prosa` — Tauri 2 desktop app (React + TypeScript + Vite)
- `packages/core` — Domain IDs, metadata contracts, errors
- `packages/document-model` — Canonical Prosa document schema and validation
- `docs/` — Architecture and decision log
- `MASTERPLAN.md` — Full product and engineering specification

## Prerequisites

- **Node.js** 22 or newer
- **pnpm** 10.x (`corepack enable && corepack prepare pnpm@10.33.0 --activate`)
- **Rust** stable and [Tauri system dependencies](https://v2.tauri.app/start/prerequisites/) (for desktop run/build). After installing via [rustup](https://rustup.rs/), ensure `~/.cargo/bin` is on your `PATH` (or run `source "$HOME/.cargo/env"` in each new shell).

## Quick start

```bash
pnpm install
pnpm test
pnpm typecheck
```

### Web UI only (no Rust)

```bash
pnpm dev
```

Open the Vite URL shown in the terminal. Tauri APIs (manuscript list/save) require the desktop shell.

### Desktop app

```bash
pnpm tauri:dev
```

### Production build

```bash
pnpm tauri:build
```

## Scripts

| Script                              | Purpose                            |
| ----------------------------------- | ---------------------------------- |
| `pnpm dev`                          | Vite dev server for Prosa          |
| `pnpm tauri:dev`                    | Tauri development window           |
| `pnpm tauri:build`                  | Bundle desktop app                 |
| `pnpm test`                         | Run workspace tests                |
| `pnpm typecheck`                    | TypeScript check                   |
| `pnpm lint`                         | ESLint                             |
| `pnpm format` / `pnpm format:check` | Prettier                           |
| `pnpm verify`                       | Full JS/TS CI checks locally       |
| `pnpm verify:all`                   | `verify` + Rust fmt, Clippy, check |

## Version control & releases

- Branching and hooks: `docs/VERSION_CONTROL.md`
- Cutting releases (tags `v*.*.*`, GitHub Actions): `docs/RELEASE.md`
- Change log: `CHANGELOG.md`

## Milestone status

This repository implements the **initial architectural milestone** from `MASTERPLAN.md`: monorepo, canonical Prosa schema with tests, minimal shell (navigation + editor), TipTap-based structured editing, global manuscript typography, and local JSON persistence via Tauri.

Not included yet: DOCX/PDF, cloud sync, full export pipeline, and additional Scribo product lines (Drama, Versus, Academia).

See `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` for diagrams, dependency rules, and known limits.
