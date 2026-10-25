import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView, ViewPlugin, Decoration, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

/** Width of the left marker column (`##### `). Body text starts here. */
export const MARKDOWN_BODY_COLUMN_CH = 6;

type LineKind = "heading" | "quote" | "break" | "body";

function lineMarkerMeta(text: string): { kind: LineKind; markerCh: number } {
  const heading = /^(#{1,5}) /.exec(text);
  if (heading) {
    return { kind: "heading", markerCh: heading[0].length };
  }
  const quote = /^> ?/.exec(text);
  if (quote) {
    return { kind: "quote", markerCh: quote[0].length };
  }
  const trimmed = text.trim();
  if (trimmed === "* * *" || trimmed === "***") {
    return { kind: "break", markerCh: 0 };
  }
  return { kind: "body", markerCh: 0 };
}

function buildLineDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    const meta = lineMarkerMeta(line.text);
    builder.add(
      line.from,
      line.from,
      Decoration.line({
        attributes: {
          class: `cm-md-line cm-md-${meta.kind}`,
          style: `--md-marker-ch:${meta.markerCh};--md-body-ch:${MARKDOWN_BODY_COLUMN_CH}`,
        },
      }),
    );
  }
  return builder.finish();
}

const markdownSourceLayoutPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildLineDecorations(view);
    }

    update(update: { docChanged: boolean; view: EditorView }) {
      if (update.docChanged) {
        this.decorations = buildLineDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

const prosaMarkdownHighlight = HighlightStyle.define([
  { tag: t.heading, color: "var(--scribo-ui-text)", fontWeight: "600" },
  { tag: t.strong, fontWeight: "600", color: "var(--scribo-ui-text)" },
  { tag: t.emphasis, fontStyle: "italic", color: "var(--scribo-ui-text)" },
  { tag: t.link, color: "var(--scribo-md-marker)" },
  { tag: t.url, color: "var(--scribo-md-marker)" },
  { tag: t.quote, color: "var(--scribo-md-marker)" },
  { tag: t.monospace, color: "var(--scribo-md-marker)" },
  { tag: t.meta, color: "var(--scribo-md-marker)" },
  { tag: t.contentSeparator, color: "var(--scribo-md-marker)" },
  { tag: t.processingInstruction, color: "var(--scribo-md-marker)" },
  { tag: t.comment, color: "var(--scribo-md-marker)" },
]);

const markdownSourceEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    fontFamily: "var(--scribo-font-mono)",
    fontSize: "0.875rem",
    lineHeight: "1.65",
    color: "var(--scribo-ui-text)",
  },
  ".cm-content": {
    caretColor: "var(--scribo-ui-caret)",
    padding: "var(--scribo-space-8) var(--scribo-space-6)",
    maxWidth: "var(--scribo-ms-max-width)",
    margin: "0 auto",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-selectionBackground": {
    backgroundColor: "var(--scribo-ui-selection-bg) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--scribo-ui-caret)",
  },
  ".cm-md-line": {
    paddingLeft: "calc(var(--md-body-ch) * 1ch)",
  },
  ".cm-md-line.cm-md-heading, .cm-md-line.cm-md-quote": {
    textIndent: "calc(var(--md-marker-ch) * -1ch)",
  },
  ".cm-md-line.cm-md-break": {
    paddingLeft: "0",
    textAlign: "center",
    color: "var(--scribo-md-marker)",
  },
});

export function markdownSourceExtensions() {
  return [
    markdown({ base: markdownLanguage }),
    markdownSourceLayoutPlugin,
    markdownSourceEditorTheme,
    syntaxHighlighting(prosaMarkdownHighlight, { fallback: true }),
  ];
}
