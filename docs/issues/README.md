# Issues

Two tracks—do not duplicate the same work in both places.

| Track                | Where                        | Use for                                                                                                           |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Written (bypass)** | [written/](./written/)       | Maintainer session logs, version batch lists, quick capture before GitHub exists or when bypassing issue overhead |
| **GitHub Issues**    | GitHub (when repo is public) | Bugs, features, triage, discussion, external contributors                                                         |

## Written issues (bypass)

- Markdown files in **`docs/issues/written/`**, usually named by date (`YYYYMMDD.md`) or topic.
- Good for: numbered release punch lists, agent/human working notes, **Done** markers inline.
- **Not** a substitute for specs, ADRs, or invariants—promote durable rules to [product/](../product/) or [specs/](../specs/).
- When an item becomes ongoing public work, open a **GitHub Issue** and link it from the written file (do not copy every GitHub comment back here).

See [written/README.md](./written/README.md).

## GitHub Issues

- Canonical **coordination** layer per [operating-model.md](../engineering/operating-model.md).
- Templates: [.github/ISSUE_TEMPLATE/](../../.github/ISSUE_TEMPLATE/).
- Policy summary: [github.md](./github.md).

## Promotion flow

```text
written note → (optional) GitHub Issue → spec/ADR + PR → changelog
```

Keep GitHub as the thread; keep the repo as the contract.
