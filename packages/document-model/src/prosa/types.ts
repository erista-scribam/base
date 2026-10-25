import type { DocumentId } from "@scribo/core";
import type { ProsaSchemaVersion } from "./version";

export type ProsaInlineMark = "bold" | "italic" | "underline" | "link";

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
  level: 1 | 2 | 3 | 4 | 5;
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

export interface ProsaListItem {
  id: string;
  content: ProsaInlineNode[];
}

export interface ProsaListBlock {
  type: "list";
  id: string;
  ordered: boolean;
  items: ProsaListItem[];
}

export type ProsaBlock =
  | ProsaHeadingBlock
  | ProsaParagraphBlock
  | ProsaBlockquoteBlock
  | ProsaSceneBreakBlock
  | ProsaListBlock;

export interface ProsaDocument {
  schemaVersion: ProsaSchemaVersion;
  id: DocumentId;
  title: string;
  blocks: ProsaBlock[];
}
