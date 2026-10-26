# Contributing to Scribo

Read [docs/README.md](docs/README.md) for the documentation map. AI agents: start with [AGENTS.md](AGENTS.md).

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
- Release by merging **`development` → `main`**; Changesets opens a **Version packages** PR and tags when merged.

Details: [docs/engineering/version-control.md](docs/engineering/version-control.md).

## Commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm changeset`    | Add a release note for the next semver bump    |
| `pnpm verify`       | CI-equivalent JS checks + Prosa frontend build |
| `pnpm verify:all`   | `verify` plus Rust fmt, Clippy, and check      |
| `pnpm typecheck`    | TypeScript across workspaces                   |
| `pnpm test`         | Vitest                                         |
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

## Product and architecture changes

- [docs/product/philosophy.md](docs/product/philosophy.md) — feature gate
- [docs/product/invariants.md](docs/product/invariants.md) — integrity rules
- [docs/product/roadmap.md](docs/product/roadmap.md) — phase alignment
- [docs/specs/](docs/specs/) — behavioral contracts for risky work
- [docs/architecture/decisions/](docs/architecture/decisions/) — ADRs
- [docs/engineering/operating-model.md](docs/engineering/operating-model.md) — workflow

Nontrivial features: plan in `docs/plans/active/` and get approval before large implementations.

See [MASTERPLAN.md](MASTERPLAN.md) and [docs/architecture/system-overview.md](docs/architecture/system-overview.md) for stack and layering.

## Issues

- **Written bypass:** [docs/issues/written/](docs/issues/written/) for maintainer batch lists.
- **GitHub Issues:** bugs and features once the repo is public ([policy](docs/issues/github.md)).

## License

Contributions are licensed under **[AGPL-3.0-or-later](LICENSE)** unless otherwise agreed in writing. See [docs/product/licensing.md](docs/product/licensing.md).

## Community

- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md) — report vulnerabilities privately
- [SUPPORT.md](SUPPORT.md)
