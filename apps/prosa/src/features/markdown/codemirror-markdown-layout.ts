import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView, ViewPlugin, Decoration, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { prosaMarkdownNavigationExtensions } from "./markdown-source-arrows";
import { prosaMarkdownKeyboardExtension } from "./markdown-keyboard";
import { markdownInlineSemanticsExtension } from "./markdown-inline-semantics";
import { prosaMarkdownSearchExtension } from "./markdown-source-search";
import { isSceneBreakLineRaw } from "./markdown-source-layout";
import { markdownEditorBottomSpace } from "./markdown-editor-bottom-space";
import { markdownActiveSentenceExtension } from "./markdown-active-sentence";

/** Fixed marker column width (`##### `). Body text starts after this. */
export const MARKDOWN_MARKER_COLUMNS = 6;

/** @deprecated use MARKDOWN_MARKER_COLUMNS */
export const MARKDOWN_BODY_COLUMN_CH = MARKDOWN_MARKER_COLUMNS;

type LineKind = "heading" | "quote" | "list" | "break" | "body";

export type LineMarkerMeta = {
  kind: LineKind;
  markerCh: number;
  /** Prefix length for syntax decorations (`#`, `>`); defaults to `markerCh`. */
  syntaxMarkerLen?: number;
};

export function lineMarkerMeta(text: string): LineMarkerMeta {
  if (isSceneBreakLineRaw(text.trim())) {
    return { kind: "break", markerCh: 0 };
  }
  const heading = /^(#{1,5}) /.exec(text);
  if (heading) {
    return { kind: "heading", markerCh: heading[0].length };
  }
  const quote = /^> ?/.exec(text);
  if (quote) {
    // Layout column is always `> ` so consecutive quote lines align in the marker gutter.
    return { kind: "quote", markerCh: 2, syntaxMarkerLen: quote[0].length };
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

const blockMarkerMark = Decoration.mark({ class: "cm-md-block-marker" });

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

    const syntaxLen = meta.syntaxMarkerLen ?? meta.markerCh;
    if (
      syntaxLen > 0 &&
      (meta.kind === "heading" || meta.kind === "quote") &&
      line.from + syntaxLen <= line.to + 1
    ) {
      builder.add(line.from, line.from + syntaxLen, blockMarkerMark);
    }
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
  { tag: t.heading, class: "cm-md-tok-heading" },
  { tag: t.strong, class: "cm-md-tok-strong" },
  { tag: t.emphasis, class: "cm-md-tok-emphasis" },
  { tag: t.strikethrough, class: "cm-md-tok-strike" },
  { tag: t.link, class: "cm-md-tok-link" },
  { tag: t.url, class: "cm-md-tok-link" },
  { tag: t.quote, class: "cm-md-tok-inline-quote" },
  { tag: t.monospace, class: "cm-md-tok-code" },
  { tag: t.meta, class: "cm-md-tok-markup" },
  { tag: t.contentSeparator, class: "cm-md-tok-markup" },
  { tag: t.processingInstruction, class: "cm-md-tok-markup" },
  { tag: t.comment, class: "cm-md-tok-markup" },
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
    fontFamily: "var(--scribam-font-mono)",
    fontSize: "var(--scribam-md-editor-font-size)",
    lineHeight: "var(--scribam-ms-line-height)",
    color: "var(--scribam-ui-text)",
    overflowX: "hidden",
  },
  ".cm-content": {
    caretColor: "var(--scribam-ui-caret)",
    padding: "var(--scribam-ms-pad-y) var(--scribam-ms-pad-x) 0",
    maxWidth: "var(--md-content-max-width, min(100%, var(--scribam-ms-max-width)))",
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
    backgroundColor: "var(--scribam-ui-selection-bg) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--scribam-ui-caret)",
  },
  ".cm-md-active-sentence": {
    backgroundColor: "color-mix(in srgb, var(--scribam-ui-accent) 14%, transparent)",
    borderRadius: "2px",
  },
  ".cm-md-line": {
    paddingLeft: "var(--md-marker-width, calc(6 * 0.6em))",
  },
  ".cm-md-line.cm-md-heading, .cm-md-line.cm-md-quote": {
    textIndent: "calc(-1 * var(--md-marker-ch) * var(--md-char-width, 0.6em))",
  },
  ".cm-md-line.cm-md-quote": {
    color: "var(--scribam-md-quote-fg)",
  },
  ".cm-md-block-marker": {
    color: "var(--scribam-ui-text) !important",
  },
  ".cm-md-line.cm-md-list": {
    paddingLeft: "calc(var(--md-marker-ch) * var(--md-char-width, 0.6em))",
    textIndent: "0",
  },
  ".cm-md-line.cm-md-break": {
    paddingLeft: "0",
    textAlign: "center",
    color: "var(--scribam-scene-break-fg)",
  },
});

const markdownScrollMargins = EditorView.scrollMargins.of((view) => ({
  top: 72,
  bottom: Math.round(view.scrollDOM.clientHeight * 0.48),
}));

export function markdownSourceExtensions() {
  return [
    markdown({ base: markdownLanguage, addKeymap: false }),
    markdownSourceLayoutPlugin,
    markdownSourceEditorTheme,
    markdownEditorBottomSpace,
    markdownActiveSentenceExtension,
    markdownScrollMargins,
    syntaxHighlighting(prosaMarkdownHighlight, { fallback: true }),
    markdownInlineSemanticsExtension,
    EditorView.lineWrapping,
    ...prosaMarkdownNavigationExtensions,
    ...prosaMarkdownSearchExtension,
    prosaMarkdownKeyboardExtension(),
  ];
}
