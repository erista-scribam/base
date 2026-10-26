# Scribam Prosa

Desktop prose editor (Tauri 2 + React). Project folders live under `Documents/Scribam` by default (legacy `Scribam Prosa` / `Scribo Prosa` folder names still open if present).

Persistence, recovery, and save guarantees are documented in [RELIABILITY.md](./RELIABILITY.md).

## App icon (Dock / Cmd+Tab)

Follow [Tauri’s icon flow](https://v2.tauri.app/develop/icons/): one **1024×1024** master, then `tauri icon`. Artwork size follows **Apple’s macOS app icon template** (824×824 content on a 1024 canvas — not hand-tuned percentages). Generator: [`scripts/build-prosa-app-icon.mjs`](../../scripts/build-prosa-app-icon.mjs) reads [`prosa.svg`](../../docs/brands/scribam-brand-kit/prosa.svg) and writes `src-tauri/icons/`.

After changing the brand mark: `pnpm icons` (from `apps/prosa`), then restart **`pnpm tauri dev`** or rebuild so Rust picks up `icon.icns` (`build.rs` watches `icons/`). UI favicon only: [`public/brand/prosa.svg`](./public/brand/prosa.svg).

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
