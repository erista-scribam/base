# ADR 0006: Recovery snapshots

**Status:** Accepted (evolved for library Markdown)  
**Date:** Early milestone (recorded 2026-10-26)

## Decision

Autosave maintains recovery data separate from the primary saved artifact so crash recovery can offer newer in-memory work. Library manuscripts use `.scribo/recovery/`; legacy internal storage used `recovery.json` per manuscript.

## Consequences

- Open path must apply [recovery policy](../../../apps/prosa/src/features/persistence/recovery-policy.ts).
- Recovery is not a substitute for revision history (Phase 2).
