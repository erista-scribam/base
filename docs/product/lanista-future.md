# Scribam Lanista (future product)

**Status:** Concept only — **not in development** in this monorepo.

## Intent

**Scribam Lanista** is planned as a **paid** desktop product for writers who want one integrated **project** and frictionless movement between Scribam apps (Prosa, Folia, Drama, and later satellites). Lanista would own cross-app project discovery, compatibility, and launch—not manuscript, deck, or script semantics.

## What we ship today

- **Standalone apps first.** Scribam Prosa is the only shipped application; each app owns its own shell, project hub, and persistence until Lanista exists.
- **Shared contracts only where they help a single app:** `@scribam/project-model`, layout v2, `.mdprosa`, capability types in manifest—these prepare for a future hub but do not require Lanista to run.
- **Brand assets:** `docs/brands/scribam-brand-kit/lanista.svg` and palette tokens document the product line; no Lanista binary.

## Open questions (explicitly unset)

- How sub-apps appear under Lanista (windowing, licensing, offline entitlement).
- Whether Lanista lives in this repo, a sibling repo, or a separate release channel.
- Catalog vs per-app `library.json` when Lanista ships.

**Supersedes for execution:** [006-scribam-lanista-platform.md](../plans/active/006-scribam-lanista-platform.md) (withdrawn MVP track).
