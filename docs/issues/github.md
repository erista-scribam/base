# GitHub Issues

**Canonical location:** the repository’s GitHub **Issues** tab (not a Markdown mirror in `docs/`).

## When to open an issue

- Reproducible bugs and regressions
- Feature proposals that need discussion or prioritization
- Multi-step work that benefits from linking PRs
- Reports from users once the repo is public

Skip issues for trivial one-line fixes if a PR alone is enough (see [operating-model.md](../engineering/operating-model.md)).

## Templates

- **Bug report** — reproduction, version, platform
- **Feature request** — writer problem, alignment with [philosophy.md](../product/philosophy.md)

Configured under [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/).

## Relationship to written bypass

[written/](./written/) logs are for maintainer batch notes. When an item graduates to tracked work:

1. Create a GitHub Issue.
2. Add `GitHub: #123` (or URL) on the written line if the file remains useful as a release checklist.

Do **not** export closed GitHub threads into `docs/issues/` unless summarizing a **decision** into a spec or ADR.

## Security

Vulnerabilities: [SECURITY.md](../../SECURITY.md) — private report, not a public issue.
