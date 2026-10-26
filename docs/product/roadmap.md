# Scribo Prosa roadmap

**Status:** Living document  
**Constitution:** [philosophy.md](./philosophy.md)

Dependency-oriented phases (from [003-prosa-deep-writing-features.md](../plans/completed/003-prosa-deep-writing-features.md)). Overlap is allowed when dependencies are satisfied. **Current focus** is completing Phase 0–1 evidence and specs, then **Revision History v1** (Phase 2).

| Phase | Name                                 | Exit condition                                               | Status                                                                        |
| ----- | ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **0** | Validate philosophy through real use | Prioritized problem list from actual writing                 | **In progress** — [friction log](../research/WRITING_FRICTION_LOG.md)         |
| **1** | Reliability & document invariants    | Failure scenarios with tests & expected behavior             | **Largely addressed** — plan 002 work, library + recovery; ongoing regression |
| **2** | Revision history                     | Inspect & restore earlier work without risking current draft | **Next** — [spec](../specs/revision-history-v1.md)                            |
| **3** | Annotation & structural analysis     | Analysis useful, explainable, separate from source of truth  | Not started                                                                   |
| **4** | Research library                     | Sources, excerpts, citations traceable to passages           | Not started                                                                   |
| **5** | Project knowledge & continuity       | Entities, consistency checks without auto-truth              | Not started                                                                   |
| **6** | Language-aware revision assistance   | Opt-in, scoped, measured false positives                     | Not started                                                                   |
| **7** | Integrations & broader platforms     | Adapters; core remains local-first                           | Not started                                                                   |

---

## Immediate work queue

**Product (plan 003):**

1. ~~Product invariants~~ → [invariants.md](./invariants.md)
2. **Research log** → [WRITING_FRICTION_LOG.md](../research/WRITING_FRICTION_LOG.md)
3. ~~Architecture audit baseline~~ → [implementation-audit.md](../architecture/implementation-audit.md)
4. **Revision history** — [spec](../specs/revision-history-v1.md) + [active plan](../plans/active/revision-history-v1.md) (implement after approval)
5. Annotation contract — after Phase 2
6. Source / project knowledge models — before Phase 4

**Workflow (plan 004, adopted 2026-10-26):**

- ~~Operating model, baseline, public doc skeleton~~ → [operating-model.md](../engineering/operating-model.md), [project-baseline.md](../engineering/project-baseline.md)
- **GitHub:** branch protection + required CI when the repo is public
- **First feature under new workflow:** Revision History v1

---

## How to propose work

1. Check the feature gate in [philosophy.md](./philosophy.md).
2. Note which roadmap phase and invariants apply.
3. Prefer a spec or ADR in `docs/` for cross-cutting behavior.
4. Ship with tests for trust-related behavior.
