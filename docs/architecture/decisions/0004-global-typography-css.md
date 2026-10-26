# ADR 0004: Global typography CSS

**Status:** Accepted  
**Date:** Early milestone (recorded 2026-10-26)

## Decision

Manuscript presentation uses global CSS variables in `manuscript.css`. Editor chrome uses separate theme variables (`globals.css` / chrome CSS).

## Consequences

- No per-paragraph font overrides in the document model.
- Theme changes affect presentation globally.
