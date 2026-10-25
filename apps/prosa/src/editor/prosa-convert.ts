import type { JSONContent } from "@tiptap/core";
import type { ProsaBlock, ProsaDocument, ProsaInlineNode } from "@scribo/document-model";
import { validateProsaDocument } from "@scribo/document-model";

function inlineId(): string {
  return `inl_${crypto.randomUUID()}`;
}

function blockId(): string {
  return `blk_${crypto.randomUUID()}`;
}

function marksFromTiptap(marks: JSONContent["marks"]): ProsaInlineNode["marks"] | undefined {
  if (!marks?.length) {
    return undefined;
  }
  const result: NonNullable<ProsaInlineNode["marks"]> = [];
  for (const mark of marks) {
    if (mark.type === "bold") result.push("bold");
    if (mark.type === "italic") result.push("italic");
    if (mark.type === "underline") result.push("underline");
    if (mark.type === "link") result.push("link");
  }
  return result.length ? result : undefined;
}

function inlineFromTextNode(node: JSONContent): ProsaInlineNode[] {
  if (node.type !== "text" || typeof node.text !== "string") {
    return [];
  }
  const marks = marksFromTiptap(node.marks);
  const linkMark = node.marks?.find((mark) => mark.type === "link");
  const href =
    linkMark && typeof linkMark.attrs?.href === "string" ? linkMark.attrs.href : undefined;
  return [
    {
      type: "text",
      id: inlineId(),
      text: node.text,
      marks,
      ...(href ? { href } : {}),
    },
  ];
}

function inlineFromBlockContent(content: JSONContent[] | undefined): ProsaInlineNode[] {
  if (!content?.length) {
    return [{ type: "text", id: inlineId(), text: "" }];
  }
  const nodes: ProsaInlineNode[] = [];
  for (const child of content) {
    if (child.type === "text") {
      nodes.push(...inlineFromTextNode(child));
    }
  }
  return nodes.length ? nodes : [{ type: "text", id: inlineId(), text: "" }];
}

function blockFromTiptap(node: JSONContent): ProsaBlock | null {
  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level;
      if (level !== 1 && level !== 2 && level !== 3 && level !== 4 && level !== 5) {
        return null;
      }
      return {
        type: "heading",
        id: blockId(),
        level,
        content: inlineFromBlockContent(node.content),
      };
    }
    case "paragraph":
      return {
        type: "paragraph",
        id: blockId(),
        content: inlineFromBlockContent(node.content),
      };
    case "blockquote": {
      const merged: ProsaInlineNode[] = [];
      for (const child of node.content ?? []) {
        if (child.type === "paragraph") {
          merged.push(...inlineFromBlockContent(child.content));
        }
      }
      return {
        type: "blockquote",
        id: blockId(),
        content: merged.length ? merged : [{ type: "text", id: inlineId(), text: "" }],
      };
    }
    case "sceneBreak":
      return { type: "scene_break", id: blockId() };
    default:
      return null;
  }
}

export function prosaDocumentFromTiptapJson(
  base: ProsaDocument,
  doc: JSONContent,
): ProsaDocument {
  const blocks: ProsaBlock[] = [];
  for (const node of doc.content ?? []) {
    const block = blockFromTiptap(node);
    if (block) {
      blocks.push(block);
    }
  }
  if (!blocks.length) {
    blocks.push({
      type: "paragraph",
      id: blockId(),
      content: [{ type: "text", id: inlineId(), text: "" }],
    });
  }
  return validateProsaDocument({ ...base, blocks });
}

function marksToTiptap(node: ProsaInlineNode): JSONContent["marks"] {
  const marks: NonNullable<JSONContent["marks"]> = [];
  for (const mark of node.marks ?? []) {
    if (mark === "bold") marks.push({ type: "bold" });
    if (mark === "italic") marks.push({ type: "italic" });
    if (mark === "underline") marks.push({ type: "underline" });
    if (mark === "link" && node.href) {
      marks.push({ type: "link", attrs: { href: node.href } });
    }
  }
  return marks.length ? marks : undefined;
}

function inlineToTiptap(nodes: ProsaInlineNode[]): JSONContent[] {
  return nodes.map((node) => ({
    type: "text",
    text: node.text,
    marks: marksToTiptap(node),
  }));
}

function blockToTiptap(block: ProsaBlock): JSONContent {
  switch (block.type) {
    case "heading":
      return {
        type: "heading",
        attrs: { level: block.level },
        content: inlineToTiptap(block.content),
      };
    case "paragraph":
      return { type: "paragraph", content: inlineToTiptap(block.content) };
    case "blockquote":
      return {
        type: "blockquote",
        content: [{ type: "paragraph", content: inlineToTiptap(block.content) }],
      };
    case "scene_break":
      return { type: "sceneBreak" };
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function tiptapJsonFromProsaDocument(document: ProsaDocument): JSONContent {
  return {
    type: "doc",
    content: document.blocks.map(blockToTiptap),
  };
}
