# Plan 005 — Project workspace, Git, and unified storage

**Status:** **Paused** (2026-10-26) — execution superseded by [006-scribo-lanista-platform.md](./006-scribo-lanista-platform.md). Shipped Phase 1–2 (and partial Phase 4) remain in the codebase until migrated under 006.  
**Adopted:** 2026-10-26

## What changed from plan 003

Plan 003 defined **writer-centred philosophy** and a feature roadmap (revision snapshots, analysis, research, knowledge). That philosophy remains in [philosophy.md](../../product/philosophy.md).

Plan 005 adds an **ambitious architectural foundation** before feature sprints:

1. **Real Git** as the version engine (writer-oriented UI, not raw Git porcelain).
2. **Unified Scribo project** (multi-manuscript, workspace entities, one coherent unit).
3. **Extensible workspace** (tasks, issues, milestones, knowledge—without becoming Jira).

**Product shape (acknowledged):** Prosa converges on **IDE-like navigation** (explorer, tabs, SCM, diffs) while remaining a **writing app first**—not a fork of any IDE; we integrate OSS libraries (Git, editors) in our own shell. **Storage (paused direction):** Prosa-as-hub and **project-root Git**—replaced by **Lanista hub**, **per-manuscript Git**, and **`.mdprosa`** in [006](./006-scribo-lanista-platform.md). Interim home → project subfolders may remain until Lanista migration.

## Pause note

Do **not** extend project-wide Git branches/merge or workspace entities under this plan. New architectural work goes to **006** and its specs ([lanista-platform-and-storage.md](../../specs/lanista-platform-and-storage.md)).

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

## Future: sync and collaboration (product north star)

Long-term **hosted sync / backend** is planned as a deliberate spinoff: **GitHub for writing**—same ideas writers already see in Prosa (projects, checkpoints, branches, diffs), not raw Git porcelain. On-disk Git + the Scribo project model remain canonical; cloud services mirror or federate that history for sharing, review, and backup. **Gate:** Phases 4–8 (local Git, branches, workspace, portable package) stable before any sync MVP. See [project-architecture-roadmap.md](./project-architecture-roadmap.md) Phase 9.
