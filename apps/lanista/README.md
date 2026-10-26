# Scribo Lanista

Desktop launcher for Scribo projects. Lists projects under your Scribo home, creates new project folders, and opens **Scribo Prosa** with `SCRIBO_PROJECT_ROOT` set.

## Development

```bash
# Terminal 1 — build Prosa once so Lanista can spawn it
pnpm tauri:dev
# or: cargo build -p prosa --manifest-path apps/prosa/src-tauri/Cargo.toml

# Terminal 2
pnpm tauri:lanista:dev
```

Optional: `SCRIBO_PROSA_BINARY=/path/to/prosa` overrides auto-detection.

## Config

`lanista.json` in the Tauri app config directory stores the Scribo home path and recents. Project data lives in project folders (`scribo.project.json`), not in Lanista config.
