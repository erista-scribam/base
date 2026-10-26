# Scribo Prosa roadmap

**Status:** Living document  
**Constitution:** [PRODUCT_CONSTITUTION.md](./PRODUCT_CONSTITUTION.md)

Dependency-oriented phases (from [003-prosa-deep-writing-features.md](./plans/003-prosa-deep-writing-features.md)). Overlap is allowed when dependencies are satisfied. **Current focus** is completing Phase 0–1 evidence and specs, then **Revision History v1** (Phase 2).

| Phase | Name                                 | Exit condition                                               | Status                                                                        |
| ----- | ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **0** | Validate philosophy through real use | Prioritized problem list from actual writing                 | **In progress** — [friction log](./research/WRITING_FRICTION_LOG.md)          |
| **1** | Reliability & document invariants    | Failure scenarios with tests & expected behavior             | **Largely addressed** — plan 002 work, library + recovery; ongoing regression |
| **2** | Revision history                     | Inspect & restore earlier work without risking current draft | **Next** — [spec draft](./specs/revision-history-v1.md)                       |
| **3** | Annotation & structural analysis     | Analysis useful, explainable, separate from source of truth  | Not started                                                                   |
| **4** | Research library                     | Sources, excerpts, citations traceable to passages           | Not started                                                                   |
| **5** | Project knowledge & continuity       | Entities, consistency checks without auto-truth              | Not started                                                                   |
| **6** | Language-aware revision assistance   | Opt-in, scoped, measured false positives                     | Not started                                                                   |
| **7** | Integrations & broader platforms     | Adapters; core remains local-first                           | Not started                                                                   |

---

## Immediate work queue (constitution §13)

1. ~~**Product invariants**~~ → [PRODUCT_INVARIANTS.md](./PRODUCT_INVARIANTS.md)
2. **Research log** → [research/WRITING_FRICTION_LOG.md](./research/WRITING_FRICTION_LOG.md)
3. **Architecture audit** → [ARCHITECTURE_AUDIT.md](./ARCHITECTURE_AUDIT.md) (baseline; refresh as code changes)
4. **Revision history spec** → [specs/revision-history-v1.md](./specs/revision-history-v1.md) → then implementation
5. **Annotation contract** — draft when Phase 2 exit is near
6. **Source / project knowledge models** — design before Phase 4 build
7. **One capability end-to-end** — Revision History v1 before parallel prototypes

---

## How to propose work

1. Check the feature gate in [PRODUCT_CONSTITUTION.md](./PRODUCT_CONSTITUTION.md).
2. Note which roadmap phase and invariants apply.
3. Prefer a spec or ADR in `docs/` for cross-cutting behavior.
4. Ship with tests for trust-related behavior.
