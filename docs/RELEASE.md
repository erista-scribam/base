# Release process

Scribo Prosa uses **Semantic Versioning** (`MAJOR.MINOR.PATCH`). Git tags use a **`v` prefix** (for example `v0.1.0`).

## Branches

| Branch        | Purpose                                                       |
| ------------- | ------------------------------------------------------------- |
| `development` | Day-to-day integration; default target for feature PRs        |
| `main`        | Release-ready history; merge from `development` when shipping |

## Version locations

Keep these in sync when cutting a release:

1. `apps/prosa/src-tauri/tauri.conf.json` → `"version"`
2. `apps/prosa/package.json` → `"version"`
3. `package.json` (root) → `"version"`
4. `CHANGELOG.md` → new section with date

## Pre-release checklist

```bash
pnpm verify
```

On macOS with Rust installed, optionally:

```bash
pnpm tauri:build
```

## Cut a release

1. Merge `development` → `main` via PR (CI must be green).
2. Update version fields and `CHANGELOG.md` on `main`.
3. Commit: `chore(release): v0.1.0` (example).
4. Tag and push:

```bash
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

5. The **Release** workflow builds desktop artifacts for macOS (Apple Silicon + Intel), Linux, and Windows, and opens a **draft** GitHub Release. Edit release notes, attach any extra assets, then publish.

## CI vs release

| Workflow  | Trigger                            | What it does                                                            |
| --------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `CI`      | Push/PR to `main` or `development` | Lint, test, typecheck, frontend build, `rustfmt`, Clippy, `cargo check` |
| `Release` | Push tag `v*.*.*`                  | Tauri production builds uploaded to GitHub Releases                     |

## Code signing (future)

macOS notarization and Windows signing are not configured yet. Release artifacts are unsigned suitable for internal testing until signing secrets are added to the repository.
