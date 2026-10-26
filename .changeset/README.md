# Changesets

Scribam uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

When your PR includes user-facing or release-notable work, add a changeset:

```bash
pnpm changeset
```

Follow the prompts (choose bump type, write a short summary). Commit the generated file under `.changeset/`.

All workspace packages release together as one version (see `fixed` in `config.json`).

Until the first release, package versions stay at **`0.0.0`**. The first merged Version packages PR will publish **`0.1.0`** (see `.changeset/initial-prosa-release.md`).
