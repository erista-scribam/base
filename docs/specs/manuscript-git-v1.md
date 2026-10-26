# Per-manuscript Git v1 (stub)

**Status:** Draft — Phase A gate for [plan 006](../plans/active/006-scribo-lanista-platform.md)

## Intent

Replace project-root Git (plan 005) with one Git repository per manuscript package under `content/manuscripts/`.

## Scope (proposal)

| In repo                              | Out of repo                          |
| ------------------------------------ | ------------------------------------ |
| `*.mdprosa`, `_manuscript.json`      | `.scribo/recovery/`                  |
| Tags/branches writer-facing in Prosa | Project manifest (see plan 006 §3.2) |

## UI verbs (Prosa)

- Scope version panel to active manuscript root.
- Checkpoint / history / diff / branch — same writer-oriented language as [project-version-control-ui.md](./project-version-control-ui.md) but manuscript-scoped.

## Migration

See [layout-v2-migration.md](./layout-v2-migration.md) for splitting project-root `.git`.
