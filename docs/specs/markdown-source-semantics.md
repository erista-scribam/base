# Markdown source semantics (Minimalist / CodeMirror)

Permanent **token-style** coloring in the markdown source editor (not the active-sentence caret band).

## Engine

Pure logic lives in **`@scribam/markdown-semantics`** (`packages/markdown-semantics`):

| API                                | Role                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `buildLineSemanticSpans(lineText)` | Dialog, delimiter, underline spans (sorted for CodeMirror)  |
| `sentenceRangeAt(text, offset)`    | Active sentence range (caret band)                          |
| `MARKDOWN_SEMANTIC_CM_CLASS`       | Stable class names → CSS in `markdown-source-semantics.css` |

Prosa only adapts spans to CodeMirror decorations (`markdown-inline-semantics.ts`). **Do not** duplicate range rules in the app.

## Two layers (do not conflate)

| Layer                | Purpose                               | Implementation                                         |
| -------------------- | ------------------------------------- | ------------------------------------------------------ |
| **Inline semantics** | Bold/italic delimiters, dialog, `<u>` | Package + Lezer `HighlightStyle` + CSS                 |
| **Dialog**           | `"…"` / `“…”`                         | `kind: "dialog"` + **locked** `--scribam-md-dialog-fg` |

Tuning inline subtlety must **not** change dialog color.

## Locked tokens

Define **only** in `apps/prosa/src/styles/tokens.css`:

- `--scribam-md-dialog-fg` — fixed hex per theme (not `color-mix` with `--scribam-ui-accent`, not brand overrides).
- `--scribam-md-inline-*` — inline semantics (separate from dialog).

**Do not** set `--scribam-md-dialog-fg` in `brand.css`.

## Locked class names

Use `MARKDOWN_SEMANTIC_CM_CLASS` from the package. CSS lives in **`markdown-source-semantics.css`** only.

## Light vs dark

- **Light & dark:** inline bold/italic use **body text color** + weight/style; delimiters use `--scribam-md-inline-markup-fg`.
- **Dialog:** fixed hex in `tokens.css` only.

## Regression guard

- Package tests: `packages/markdown-semantics/src/*.test.ts`
- CSS contract: `packages/markdown-semantics/src/css-contract.test.ts`
