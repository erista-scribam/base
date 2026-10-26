# Scribam Brand Kit — v1.0

Vector assets and tokens aligned with the [brand sheet](./brand-sheet-v1.jpg). **Scribam** (_scribam_, “let me write”) is the primary line; **(instead of edit)** is the secondary tagline on lockups. Product law: [philosophy.md](../../product/philosophy.md).

## Files

| File                        | Role                                                    |
| --------------------------- | ------------------------------------------------------- |
| `brand-sheet-v1.jpg`        | Reference board (logo, icons, palette, type)            |
| `scribam-glyph.svg`         | Brushstroke **S** + ink drop (sync into mark/wordmarks) |
| `scribam-mark.svg`          | Parent app icon (Ink field, Paper mark, Focus accent)   |
| `scribam-wordmark.svg`      | Horizontal lockup — light (Paper)                       |
| `scribam-wordmark-dark.svg` | Horizontal lockup — dark (Ink)                          |
| `lanista.svg`               | Future hub — slate + four-point star                    |
| `prosa.svg`                 | Prose — green + quill                                   |
| `drama.svg`                 | Screenplay — orange + clapper                           |
| `folia.svg`                 | Presentations — blue + stacked slides                   |
| `brand-tokens.css`          | Palette + brand type stacks                             |

## Palette

| Token   | Hex       | Use                             |
| ------- | --------- | ------------------------------- |
| Ink     | `#0F172A` | Primary dark, wordmark on Paper |
| Paper   | `#F8FAFC` | Primary light                   |
| Focus   | `#6366F1` | Brand accent (mark underline)   |
| Lanista | `#334155` | Hub app                         |
| Prosa   | `#059669` | Prose app                       |
| Drama   | `#D97706` | Screenplay app                  |
| Folia   | `#2563EB` | Presentation app                |

## Typography

| Role                      | Typeface              |
| ------------------------- | --------------------- |
| Brand / UI                | **Plus Jakarta Sans** |
| Wordmark & prose default  | **Source Serif 4**    |
| Markdown / code           | **JetBrains Mono**    |
| Screenplay (future Drama) | **Courier Prime**     |

Wordmark SVGs reference these families for **export and marketing** lockups. The **Prosa app** keeps its own reading typography (Literata for manuscripts, system UI sans, system monospace)—see `apps/prosa/src/styles/tokens.css`.

## Brand essence (from sheet)

_Latin **scribam** — “I may write” / “Let me write.”_ A deliberate, slightly rebellious imperative: refuse to be trapped in editing and formatting; commit to the act of writing. Keywords: disobedience, creation, autonomy, plain text, open source, writer first.

## In-app usage

| App   | UI                                                                              | Favicon                             |
| ----- | ------------------------------------------------------------------------------- | ----------------------------------- |
| Prosa | Sidebar brand bar, `--scribam-prosa` accent (`apps/prosa/src/styles/brand.css`) | `apps/prosa/public/brand/prosa.svg` |

Copy favicon assets into each app’s `public/brand/` when icons change. Lanista is reserved for a future product — [lanista-future.md](../../product/lanista-future.md).
