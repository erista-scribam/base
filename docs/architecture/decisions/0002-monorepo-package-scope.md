# ADR 0002: Monorepo package scope

**Status:** Accepted  
**Date:** Early milestone (recorded 2026-10-26)

## Decision

Start with `@scribo/core` and `@scribo/document-model` only. Defer additional packages (`editor`, `rendering`, `export`, etc.) until a concrete boundary exists.

## Consequences

- Most UI and editor code lives in `apps/prosa` for now.
- Extract packages when reuse or testing demands it—not speculatively.
