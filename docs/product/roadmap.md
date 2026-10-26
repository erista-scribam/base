# Scribo Prosa roadmap

**Status:** Living document  
**Constitution:** [philosophy.md](./philosophy.md)  
**Execution:** [005-project-workspace-and-git.md](../plans/active/005-project-workspace-and-git.md) · [project-architecture-roadmap.md](../plans/active/project-architecture-roadmap.md)

Plan 003 remains the **philosophy and capability vision** ([completed archive](../plans/completed/003-prosa-deep-writing-features.md)). **Implementation** now flows through **plan 005** (Git + project + workspace), not the old linear revision-checkpoint design.

**Shell & disk:** IDE-like navigation, writing-first product, no IDE fork, **Prosa home → project folders** — [prosa-shell-and-projects.md](./prosa-shell-and-projects.md).

## Current focus

1. **Review** [project-architecture-and-storage.md](../specs/project-architecture-and-storage.md).
2. **Approve** open decisions in [pending-decisions.md](../architecture/decisions/pending-decisions.md).
3. **Run** [Git feasibility spike](../plans/active/git-integration-feasibility.md) (after approval).
4. **Build** Phase 4–5 **writer-visible** Git ([UI spec](../specs/project-version-control-ui.md)): history panel, branches, then merge UI.

## Capability map (plan 003 → plan 005)

| Vision (003)                   | Delivery vehicle (005+)                     |
| ------------------------------ | ------------------------------------------- |
| Revision history & compare     | Git commits, branches, merge UI             |
| Research library               | `knowledge/` + project manifest             |
| Analysis modes                 | Workspace panel + non-mutating overlays     |
| Project knowledge / continuity | `knowledge/entities.json` + indexes         |
| Integrations / premium sync    | Phase 8+ adapters; AGPL open core unchanged |

## Evidence (Phase 0)

[WRITING_FRICTION_LOG.md](../research/WRITING_FRICTION_LOG.md) — still open.

## How to propose work

1. Feature gate in [philosophy.md](./philosophy.md).
2. Align with [project-architecture-roadmap.md](../plans/active/project-architecture-roadmap.md) phase.
3. Spec or pending ADR for cross-cutting changes.
