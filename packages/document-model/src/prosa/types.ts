import type { DocumentId } from "@scribam/core";
import type { ProsaSchemaVersion } from "./version";

export type ProsaInlineMark = "bold" | "italic" | "underline" | "link" | "code" | "strike";

export interface ProsaInlineNode {
  type: "text";
  id: string;
  text: string;
  marks?: ProsaInlineMark[];
  /** Required when the link mark is present. */
  href?: string;
}

export interface ProsaHeadingBlock {
  type: "heading";
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: ProsaInlineNode[];
}

export interface ProsaParagraphBlock {
  type: "paragraph";
  id: string;
  content: ProsaInlineNode[];
}

export interface ProsaBlockquoteBlock {
  type: "blockquote";
  id: string;
  content: ProsaInlineNode[];
}

export interface ProsaSceneBreakBlock {
  type: "scene_break";
  id: string;
}

export interface ProsaCodeBlockBlock {
  type: "code_block";
  id: string;
  text: string;
  language?: string;
}

export interface ProsaListItem {
  id: string;
  content: ProsaInlineNode[];
  /** Nesting depth (0 = top level). */
  indent?: number;
  /** Task-list checkbox state. */
  checked?: boolean;
}

export interface ProsaListBlock {
  type: "list";
  id: string;
  ordered: boolean;
  /** Task list (`- [ ]` / `- [x]`). */
  task?: boolean;
  items: ProsaListItem[];
}

export type ProsaBlock =
  | ProsaHeadingBlock
  | ProsaParagraphBlock
  | ProsaBlockquoteBlock
  | ProsaSceneBreakBlock
  | ProsaCodeBlockBlock
  | ProsaListBlock;

export interface ProsaDocument {
  schemaVersion: ProsaSchemaVersion;
  id: DocumentId;
  title: string;
  blocks: ProsaBlock[];
}
