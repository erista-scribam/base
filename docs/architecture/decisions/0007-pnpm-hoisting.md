# ADR 0007: pnpm hoisting for Vite

**Status:** Accepted  
**Date:** Early milestone (recorded 2026-10-26)

## Decision

Root `.npmrc` uses `node-linker=hoisted` so Vite 8 / Rolldown resolves TipTap and ProseMirror packages reliably.

## Consequences

- Do not switch linker mode without validating Prosa dev/build.
- Document in onboarding if contributors use isolated node linker globally.
