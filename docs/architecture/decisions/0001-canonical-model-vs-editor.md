# ADR 0001: Canonical model vs editor

**Status:** Accepted  
**Date:** Early milestone (recorded at workflow baseline 2026-10-26)

## Context

Editors (TipTap, CodeMirror) have their own document JSON. Writers need a stable, validated manuscript representation.

## Decision

Prosa manuscripts are defined by `@scribo/document-model`, not TipTap/ProseMirror JSON. Editors are adapters with conversion at the app boundary.

## Consequences

- All persistence and validation target the canonical model (or library Markdown derived from it).
- Editor upgrades must preserve conversion tests.
