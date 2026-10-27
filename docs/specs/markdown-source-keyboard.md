# Markdown source keyboard (Minimalist / CodeMirror)

Behavior matches [iA Writer Smart Automation](https://ia.net/writer/support/editor/smart-automation) on **source lines** (what the user typed), not CommonMark lazy block structure.

## Enter (Return)

| Current line                        | Action                                                 |
| ----------------------------------- | ------------------------------------------------------ |
| Blockquote with text (`> …`)        | New line with `> `                                     |
| Empty blockquote (`> ` or `>` only) | Remove marker; exit blockquote                         |
| List item with text                 | New line with same list prefix                         |
| Empty list item                     | Remove marker; exit list                               |
| Heading with text                   | Plain new line (no `#` continuation)                   |
| Empty heading marker                | Remove `#` markers                                     |
| Plain paragraph (no block prefix)   | Plain new line — **never** insert `> ` or list markers |

Important: a line without a `>` prefix is always a plain paragraph, even when CommonMark would still nest it inside a blockquote. Use a blank line between quoted and unquoted source lines when you want a hard break in the parsed document.

## Shift+Enter

Hard line break: insert `  \n` (Markdown line break).

## Backspace

At block marker only: [`deleteMarkupBackward`](https://codemirror.net/6/docs/ref/#lang-markdown.deleteMarkupBackward) from `@codemirror/lang-markdown` (unbind CM default markdown Enter keymap; see `markdown-keyboard.ts`).

## Implementation

Single extension: `apps/prosa/src/features/markdown/markdown-keyboard.ts`.  
Line classification: `lineMarkerMeta` in `codemirror-markdown-layout.ts`.
