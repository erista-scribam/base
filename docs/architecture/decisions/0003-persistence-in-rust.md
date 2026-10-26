# ADR 0003: Persistence in Rust

**Status:** Accepted  
**Date:** Early milestone (recorded 2026-10-26)

## Decision

Manuscript I/O goes through Tauri commands and Rust filesystem APIs, not the frontend FS plugin.

## Consequences

- Permissions stay minimal and explicit in Tauri capabilities.
- React remains free of direct filesystem logic.
