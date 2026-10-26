# Lanista platform and storage (stub)

**Status:** **Deferred** — [lanista-future.md](../product/lanista-future.md); [plan 006](../plans/active/006-scribo-lanista-platform.md) withdrawn.  
**Supersedes (for execution):** project-root Git and Prosa-as-hub sections of [project-architecture-and-storage.md](./project-architecture-and-storage.md)

## Purpose

Normative specification for:

- Scribo Lanista home, project registry, and satellite app launch.
- Layout v2: forced `content/manuscripts/` for Prosa; per-manuscript Git; `.mdprosa`.
- Filesystem grants and error codes.

## Contents to author (Phase A)

1. Directory trees and `scribo.project.json` layout v2 schema.
2. Lanista ↔ Prosa launch contract (`SCRIBO_*` env / CLI args).
3. Grant enforcement algorithm (Rust pseudocode + test matrix).
4. Per-manuscript Git layout and relationship to project manifest.
5. Migration M0–M5 from layout v1 + project-root Git + `.md`.
6. Failure modes and user-visible errors (blocking vs recoverable).

**Do not implement** grant enforcement or Git split in application code until this spec is approved.

## Related stubs (create in Phase A)

- [mdprosa-format-v1.md](./mdprosa-format-v1.md)
- [app-filesystem-grants.md](./app-filesystem-grants.md)
- [manuscript-git-v1.md](./manuscript-git-v1.md)
- [layout-v2-migration.md](./layout-v2-migration.md)
