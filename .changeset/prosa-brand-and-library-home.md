---
"@scribam/prosa": patch
---

Post-**0.5.0** polish on `development` (after `main` release **0.5.0**):

- **Brand kit** — Sync lockups from canonical `scribam-s-glyph.svg` only (`scribam-glyph.svg`, `scribam-mark.svg`); drop generated horizontal wordmark SVGs from the kit.
- **Desktop icon** — Apple macOS 824×824-in-1024 template via `scripts/build-prosa-app-icon.mjs` + Tauri `icon` CLI (no manual scale tweaks). UI favicon stays `public/brand/prosa.svg`.
- **Library home** — On every launch: rename or merge `Documents/Scribo Prosa` / `Documents/Scribam Prosa` into `Documents/Scribam`, rewrite `library.json` (`rootPath`, `homePath`, recents), and adopt `library.json` from legacy app config (`com.scribo.prosa`) when the Scribam config is missing.
- **Docs** — Scribam home path and legacy dual-read called out in invariants, specs, and MASTERPLAN §3.
