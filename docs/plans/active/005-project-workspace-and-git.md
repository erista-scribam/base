# Plan 005 — Project workspace, Git, and unified storage

**Status:** Active (supersedes [003](../completed/003-prosa-deep-writing-features.md) for **execution**)  
**Adopted:** 2026-10-26

## What changed from plan 003

Plan 003 defined **writer-centred philosophy** and a feature roadmap (revision snapshots, analysis, research, knowledge). That philosophy remains in [philosophy.md](../../product/philosophy.md).

Plan 005 adds an **ambitious architectural foundation** before feature sprints:

1. **Real Git** as the version engine (writer-oriented UI, not raw Git porcelain).
2. **Unified Scribo project** (multi-manuscript, workspace entities, one coherent unit).
3. **Extensible workspace** (tasks, issues, milestones, knowledge—without becoming Jira).

## Canonical deliverables (this plan)

| Deliverable                 | Path                                                                                         | Purpose                                  |
| --------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Architecture & storage spec | [specs/project-architecture-and-storage.md](../../specs/project-architecture-and-storage.md) | Source-of-truth design                   |
| Git feasibility spike plan  | [git-integration-feasibility.md](./git-integration-feasibility.md)                           | Bounded experiment before production Git |
| Implementation roadmap      | [project-architecture-roadmap.md](./project-architecture-roadmap.md)                         | Dependency-ordered phases                |
| Pending ADR register        | [decisions/pending-decisions.md](../../architecture/decisions/pending-decisions.md)          | Decisions awaiting evidence/approval     |

## Superseded / deferred

| Item                                                                                       | Status                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [revision-history-v1.md](../../specs/revision-history-v1.md) (linear `.scribo/revisions/`) | **Superseded** by Git-based history in plan 005—retain as historical alternative only                                    |
| [revision-history-v1.md](./revision-history-v1.md) active plan                             | **Withdrawn**—replace with architecture phases                                                                           |
| Plan 003 feature phases 2–7                                                                | **Re-scoped** under [project-architecture-roadmap.md](./project-architecture-roadmap.md) after storage + Git foundations |

## Approval gates

1. **Architectural review** — approve [project-architecture-and-storage.md](../../specs/project-architecture-and-storage.md) recommendations.
2. **Git spike** — execute [git-integration-feasibility.md](./git-integration-feasibility.md); accept/reject Git as engine.
3. **Implementation** — no production Git/project code until both gates pass.

## Non-negotiables (from 003 + engineering)

- Local-first editing without cloud.
- No silent loss of authored content.
- Analysis/workspace metadata must not silently mutate manuscript files.
- `@scribo/core` stays free of HTTP, ORM, React, Node I/O.
