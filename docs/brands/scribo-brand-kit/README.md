# Scribo Brand Kit — v1.0

Editable, scalable SVG starter assets for the Scribo identity.

## Files

- `scribo-mark.svg` — square parent-brand mark / app icon (filled letterform **S**)
- `scribo-wordmark.svg` — light-background wordmark with tagline
- `scribo-wordmark-dark.svg` — dark-background wordmark with tagline
- `lanista.svg` — future hub product icon (not shipped as an app)
- `prosa.svg` — prose-writing icon
- `drama.svg` — screenplay icon
- `folia.svg` — presentation icon
- `brand-tokens.css` — CSS custom properties for the brand palette

## Core palette

- Scribo Ink: `#0F172A`
- Scribo Paper: `#F8FAFC`
- Indigo Focus: `#6366F1`
- Lanista: `#334155`
- Prosa: `#059669`
- Drama: `#D97706`
- Folia: `#2563EB`

The SVG wordmarks use an Inter-first system font stack. For exact rendering, install Inter or Plus Jakarta Sans. These are first-pass vector assets: review the mark at small sizes and adjust geometry before treating the identity as final trademark artwork.

## In-app usage

| App   | UI                                                                                | Favicon                             |
| ----- | --------------------------------------------------------------------------------- | ----------------------------------- |
| Prosa | Sidebar brand bar + `--scribo-prosa` accent via `apps/prosa/src/styles/brand.css` | `apps/prosa/public/brand/prosa.svg` |

Runtime SVG imports resolve from this folder (`?url` in Vite). Copy favicon assets into each shipped app’s `public/brand/` when icons change. Lanista assets are reserved for a future product — see [lanista-future.md](../../product/lanista-future.md).
