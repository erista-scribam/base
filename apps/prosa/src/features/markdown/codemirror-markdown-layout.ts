import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView, ViewPlugin, Decoration, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { prosaMarkdownNavigationExtensions } from "./markdown-source-arrows";
import { prosaMarkdownShiftEnterKeymap } from "./markdown-source-enter";
import { isSceneBreakLineRaw } from "./markdown-source-layout";
import { markdownEditorBottomSpace } from "./markdown-editor-bottom-space";
import { markdownActiveSentenceExtension } from "./markdown-active-sentence";

/** Fixed marker column width (`##### `). Body text starts after this. */
export const MARKDOWN_MARKER_COLUMNS = 6;

/** @deprecated use MARKDOWN_MARKER_COLUMNS */
export const MARKDOWN_BODY_COLUMN_CH = MARKDOWN_MARKER_COLUMNS;

type LineKind = "heading" | "quote" | "list" | "break" | "body";

export function lineMarkerMeta(text: string): { kind: LineKind; markerCh: number } {
  if (isSceneBreakLineRaw(text.trim())) {
    return { kind: "break", markerCh: 0 };
  }
  const heading = /^(#{1,5}) /.exec(text);
  if (heading) {
    return { kind: "heading", markerCh: heading[0].length };
  }
  const quote = /^> ?/.exec(text);
  if (quote) {
    return { kind: "quote", markerCh: quote[0].length };
  }
  const ordered = /^(\d+\.\s)/.exec(text);
  if (ordered?.[1]) {
    return { kind: "list", markerCh: ordered[1].length };
  }
  const taskBullet = /^[-*+]\s+\[[ xX]\]\s/.exec(text);
  if (taskBullet) {
    return { kind: "list", markerCh: taskBullet[0].length };
  }
  const taskOrdered = /^\d+\.\s+\[[ xX]\]\s/.exec(text);
  if (taskOrdered) {
    return { kind: "list", markerCh: taskOrdered[0].length };
  }
  const bullet = /^([-*+]\s)/.exec(text);
  if (bullet?.[1]) {
    return { kind: "list", markerCh: bullet[1].length };
  }
  if (text.trimStart().startsWith("```")) {
    return { kind: "break", markerCh: 0 };
  }
  return { kind: "body", markerCh: 0 };
}

function buildLineDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  let previousKind: LineKind | null = null;
  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
    const line = view.state.doc.line(lineNumber);
    const meta = lineMarkerMeta(line.text);
    const classes = [`cm-md-line`, `cm-md-${meta.kind}`];
    if (meta.kind === "body") {
      classes.push("cm-md-paragraph");
    }
    if (previousKind === "quote" && meta.kind === "body") {
      classes.push("cm-md-after-quote");
    }

    previousKind = meta.kind;
    builder.add(
      line.from,
      line.from,
      Decoration.line({
        class: classes.join(" "),
        attributes: {
          style: `--md-marker-ch:${meta.markerCh}`,
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
    display: "flex",
    flexDirection: "column",
    height: "100%",
    maxHeight: "100%",
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    flex: "1 1 0",
    minHeight: "0",
    overflowY: "auto",
    fontFamily: "var(--scribo-font-mono)",
    fontSize: "var(--scribo-md-editor-font-size)",
    lineHeight: "var(--scribo-ms-line-height)",
    color: "var(--scribo-ui-text)",
    overflowX: "hidden",
  },
  ".cm-content": {
    caretColor: "var(--scribo-ui-caret)",
    padding: "var(--scribo-ms-pad-y) var(--scribo-ms-pad-x) 0",
    maxWidth: "var(--md-content-max-width, min(100%, var(--scribo-ms-max-width)))",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  ".cm-line": {
    wordBreak: "break-word",
    overflowWrap: "anywhere",
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
  ".cm-md-active-sentence": {
    backgroundColor: "color-mix(in srgb, var(--scribo-ui-accent) 14%, transparent)",
    borderRadius: "2px",
  },
  ".cm-md-line": {
    paddingLeft: "var(--md-marker-width, calc(6 * 0.6em))",
  },
  ".cm-md-line.cm-md-heading, .cm-md-line.cm-md-quote": {
    textIndent: "calc(-1 * var(--md-marker-ch) * var(--md-char-width, 0.6em))",
  },
  ".cm-md-line.cm-md-list": {
    paddingLeft: "calc(var(--md-marker-ch) * var(--md-char-width, 0.6em))",
    textIndent: "0",
  },
  ".cm-md-line.cm-md-break": {
    paddingLeft: "0",
    textAlign: "center",
    color: "var(--scribo-scene-break-fg)",
  },
});

const markdownScrollMargins = EditorView.scrollMargins.of((view) => ({
  top: 72,
  bottom: Math.round(view.scrollDOM.clientHeight * 0.48),
}));

export function markdownSourceExtensions() {
  return [
    markdown({ base: markdownLanguage }),
    markdownSourceLayoutPlugin,
    markdownSourceEditorTheme,
    markdownEditorBottomSpace,
    markdownActiveSentenceExtension,
    markdownScrollMargins,
    syntaxHighlighting(prosaMarkdownHighlight, { fallback: true }),
    EditorView.lineWrapping,
    ...prosaMarkdownNavigationExtensions,
    prosaMarkdownShiftEnterKeymap,
  ];
}
