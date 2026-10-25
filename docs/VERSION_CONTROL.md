# Version control

## Remote and branches

- **Remote:** `origin` → GitHub (`mikevar/scribo`)
- **`development`** — active integration branch
- **`main`** — releases and stable history

Feature work branches from `development` (for example `feature/prosa-export`). Open PRs back into `development`. Release PRs merge `development` → `main`.

## Commits

Use clear, imperative subjects. Conventional Commits are encouraged but not enforced:

- `feat(prosa): …`
- `fix(document-model): …`
- `chore(ci): …`
- `docs: …`

Keep commits focused; avoid mixing refactors with feature work when possible.

## Lockfiles

Commit **`pnpm-lock.yaml`** and **`Cargo.lock`**. CI uses `--frozen-lockfile` / Cargo lockfile integrity.

## Local hooks (optional)

Enable shared pre-commit checks:

```bash
pnpm hooks:install
```

This sets `core.hooksPath` to `.githooks/` (local git config, not committed). The hook runs the same fast checks as CI’s JavaScript job.

## Automation

| Item                   | Location                                       |
| ---------------------- | ---------------------------------------------- |
| CI on push/PR          | `.github/workflows/ci.yml`                     |
| Desktop release builds | `.github/workflows/release.yml` (tag `v*.*.*`) |
| Dependency updates     | `.github/dependabot.yml`                       |
| PR template            | `.github/pull_request_template.md`             |

See `docs/RELEASE.md` for tagging and publishing.
