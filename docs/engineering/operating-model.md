# Engineering operating model

**Status:** Active (adopted 2026-10-26)  
**Full source plan:** [completed/004-workflow-total-revamp.md](../plans/completed/004-workflow-total-revamp.md)

## Summary

Scribam uses a **repository-first, GitHub-enabled** workflow:

| Layer                                 | Role                                      |
| ------------------------------------- | ----------------------------------------- |
| **Repository (`docs/`, specs, ADRs)** | Canonical durable knowledge               |
| **GitHub Issues / PRs**               | Coordination and review—not a second wiki |
| **Git history**                       | Implementation record                     |
| **Tests & CI**                        | Correctness evidence                      |

Do **not** mirror every issue comment or CI log into Markdown. Promote lasting conclusions into canonical docs.

Do **not** manufacture retroactive issues or ADRs for pre-baseline work. See [project-baseline.md](./project-baseline.md).

## Source-of-truth matrix

| Topic                       | Canonical path                                                         |
| --------------------------- | ---------------------------------------------------------------------- |
| Product philosophy          | [product/philosophy.md](../product/philosophy.md)                      |
| Roadmap                     | [product/roadmap.md](../product/roadmap.md)                            |
| Invariants                  | [product/invariants.md](../product/invariants.md)                      |
| Architecture overview       | [architecture/system-overview.md](../architecture/system-overview.md)  |
| ADRs                        | [architecture/decisions/](../architecture/decisions/)                  |
| Feature contracts           | [specs/](../specs/)                                                    |
| Agent & contributor entry   | [AGENTS.md](../../AGENTS.md), [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| Active implementation plans | [plans/active/](../plans/active/)                                      |
| Written issue bypass        | [issues/written/](../issues/written/)                                  |
| GitHub coordination         | GitHub Issues ([policy](../issues/github.md))                          |
| Opening baseline snapshot   | [project-baseline.md](./project-baseline.md)                           |

## Work lifecycle (meaningful changes)

1. Capture → 2. Triage → 3. Specify (if risky) → 4. Plan in `docs/plans/active/` → 5. Implement → 6. Validate (`pnpm verify` / `verify:all`) → 7. Review → 8. Integrate → 9. Release (Changesets) → 10. Close loop (update roadmap/spec/ADR as needed).

**Planning rule:** Do not start nontrivial implementation until the maintainer approves the plan in `docs/plans/active/`.

## Definition of done

- Acceptance criteria met
- Relevant tests pass (or gaps called out)
- Canonical docs updated if contracts changed
- Changeset when user-visible release impact
- Follow-ups recorded (issue or doc), not left implicit

## Public readiness

Before inviting external contributors: LICENSE, README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT, issue/PR templates, CI, and clear build/test docs—see plan 004 §12. Track remaining gaps in [project-baseline.md](./project-baseline.md).

## Final rule

**Record the past honestly, document durable knowledge in the repository, coordinate active work on GitHub, and require evidence for correctness claims.**
