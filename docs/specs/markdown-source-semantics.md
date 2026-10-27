# Markdown source semantics (Minimalist / CodeMirror)

Permanent **token-style** coloring in the markdown source editor (not the active-sentence caret band).

## Two layers (do not conflate)

| Layer                | Purpose                                               | Implementation                                                                             |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Inline semantics** | Bold, italic, strike, markup delimiters, links, `<u>` | Lezer `HighlightStyle` + `markdown-source-semantics.css`                                   |
| **Dialog**           | `"…"` / `“…”` spans                                   | `cm-md-tok-dialog` in `markdown-inline-semantics.ts` + **locked** `--scribam-md-dialog-fg` |

Tuning subtlety for bold/italic must **not** change dialog color. Dialog has its own token.

## Locked tokens

Define **only** in `apps/prosa/src/styles/tokens.css`:

- `--scribam-md-dialog-fg` — fixed hex per theme (not `color-mix` with `--scribam-ui-accent`, not brand overrides).
- `--scribam-md-inline-*` — inline semantics (may use mix toward body text).

**Do not** set `--scribam-md-dialog-fg` in `brand.css` or other theme files.

## Locked class names

| Class                                            | Meaning                                |
| ------------------------------------------------ | -------------------------------------- |
| `cm-md-tok-dialog`                               | Dialog double-quoted span (decoration) |
| `cm-md-tok-strong` / `tok-strong`                | Bold content (Lezer)                   |
| `cm-md-tok-emphasis` / `tok-emphasis`            | Italic content (Lezer)                 |
| `cm-md-tok-delimiter`                            | `**`, `*`, `` ` ``, `<u>`, `~~` (explicit decoration) |
| `cm-md-tok-markup` / `tok-processingInstruction` | Lezer fallback for delimiters          |

CSS for these lives in **`markdown-source-semantics.css`** only.

## Dialog detection

Line-local regex in `markdown-inline-semantics.ts` (`DIALOG_QUOTED_PATTERN`). Apostrophes inside quotes (`don't`) must not split the span.

## Light vs dark

- **Light & dark:** inline bold/italic use **body text color** + weight/style only; delimiters use `--scribam-md-inline-markup-fg` (theme-specific, quieter than body).
- **Dialog:** fixed `--scribam-md-dialog-fg` hex in `tokens.css` only; never tied to inline markup tokens.

## Regression guard

`markdown-source-semantics.contract.test.ts` — dialog token defined in `tokens.css`, absent from `brand.css`, dialog class wired in inline semantics.
