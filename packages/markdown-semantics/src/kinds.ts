import type { TextRange } from "./ranges";

/** Presentation-only spans in markdown source (never mutates text). */
export type SemanticSpanKind = "dialog" | "delimiter" | "underline";

/** CodeMirror / CSS class for each kind — see docs/specs/markdown-source-semantics.md */
export const MARKDOWN_SEMANTIC_CM_CLASS = {
  dialog: "cm-md-tok-dialog",
  delimiter: "cm-md-tok-delimiter",
  underline: "cm-md-tok-underline-text",
} as const satisfies Record<SemanticSpanKind, string>;

export type SemanticSpan = TextRange & { kind: SemanticSpanKind };
