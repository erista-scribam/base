# Revision History v1 — implementation plan

**Status:** Awaiting approval (do not implement until approved)  
**Spec (canonical contract):** [specs/revision-history-v1.md](../../specs/revision-history-v1.md)  
**Roadmap:** Phase 2 in [product/roadmap.md](../../product/roadmap.md)

## Problem

Writers need trustworthy history, diff, and restore—not only crash recovery.

## Next steps after approval

1. Resolve open decisions in the spec (retention, checkpoint interval, UI placement).
2. Implement Rust `revisions` module + post-save checkpoints.
3. UI: list, diff preview, restore with `pre_restore` semantics.
4. Tests per spec §11; update [implementation-audit.md](../../architecture/implementation-audit.md).

## Non-goals

Branching, merge, cloud sync (v1).
