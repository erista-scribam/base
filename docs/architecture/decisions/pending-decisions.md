# Pending architecture decisions (ADR register)

**Status:** Proposed entries only — **no accepted ADRs** for these topics yet.

Do not mark **Accepted** until explicit human approval after evidence.

| ADR topic                         | Decision required                                                 | Alternatives                                                   | Evidence still needed                                           | Status                             |
| --------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| Git integration strategy          | libgit2 vs CLI vs hybrid                                          | Embedded only; CLI only; hybrid                                | [Spike done](../../research/git-spike-results.md); DMG size TBD | **Proposed — hybrid**              |
| Canonical project storage         | Project directory vs monolithic `.scribo`                         | Dir + Git (recommended); zip-only live; SQLite blob            | Migration UX prototype                                          | **Awaiting approval**              |
| Content file granularity          | One `.md` per manuscript vs per chapter/scene                     | Single file; split by heading; `_manuscript.json` + many files | Writer workflow tests                                           | **Awaiting approval**              |
| SQLite vs files for indexes       | Index-only SQLite under `.scribo/`                                | No SQLite; full-text in Git hooks                              | Performance on large corpus                                     | **Awaiting approval**              |
| Project identity                  | UUID project id + human slug path                                 | UUID only                                                      | Import/export tests                                             | **Proposed**                       |
| Stable block IDs in Markdown      | HTML comment anchors vs front-matter map vs `.prosa.json` sidecar | Each has merge/sync trade-offs                                 | Shipped: `<!-- scribo:block=... -->` + TipTap attrs             | **Proposed — comment anchors**     |
| Portable `.scribo` package format | Zip vs custom container + manifest signature                      | Plain zip; git bundle                                          | Security review                                                 | **Proposed**                       |
| Auto-commit policy                | Idle auto-commit vs manual only                                   | Configurable                                                   | User research                                                   | **Proposed**                       |
| Assets / Git LFS                  | LFS vs gitignore + external store                                 | —                                                              | Repo size tests                                                 | **Proposed**                       |
| Legacy library coexistence        | Import-only vs dual-mode one release                              | —                                                              | Auto-move root `.md` on launch                                  | **Proposed — dual-mode shrinking** |

When a row moves to **Accepted**, create `docs/architecture/decisions/NNNN-<slug>.md` and link here.
