import type { JSONContent } from "@tiptap/core";
import type { ProsaBlock, ProsaDocument, ProsaInlineNode } from "@scribo/document-model";
import { validateProsaDocument } from "@scribo/document-model";

function inlineId(): string {
  return `inl_${crypto.randomUUID()}`;
}

function blockId(): string {
  return `blk_${crypto.randomUUID()}`;
}

function blockIdFromNode(node: JSONContent): string {
  const attr = node.attrs?.scriboBlockId;
  if (typeof attr === "string" && attr.startsWith("blk_")) {
    return attr;
  }
  return blockId();
}

function blockAttrs(block: ProsaBlock): Record<string, unknown> {
  return { scriboBlockId: block.id };
}

function listItemId(): string {
  return `itm_${crypto.randomUUID()}`;
}

function linkHrefFromMarks(marks: JSONContent["marks"]): string | undefined {
  const linkMark = marks?.find((mark) => mark.type === "link");
  const href = linkMark?.attrs?.href;
  return typeof href === "string" && href.length > 0 ? href : undefined;
}

function marksFromTiptap(
  marks: JSONContent["marks"],
  href: string | undefined,
): ProsaInlineNode["marks"] | undefined {
  if (!marks?.length) {
    return undefined;
  }
  const result: NonNullable<ProsaInlineNode["marks"]> = [];
  for (const mark of marks) {
    if (mark.type === "bold") result.push("bold");
    if (mark.type === "italic") result.push("italic");
    if (mark.type === "underline") result.push("underline");
    if (mark.type === "code") result.push("code");
    if (mark.type === "strike") result.push("strike");
    if (mark.type === "link" && href) result.push("link");
  }
  return result.length ? result : undefined;
}

function inlineFromTextNode(node: JSONContent): ProsaInlineNode[] {
  if (node.type !== "text" || typeof node.text !== "string") {
    return [];
  }
  const href = linkHrefFromMarks(node.marks);
  const marks = marksFromTiptap(node.marks, href);
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
      if (level !== 1 && level !== 2 && level !== 3 && level !== 4 && level !== 5 && level !== 6) {
        return null;
      }
      return {
        type: "heading",
        id: blockIdFromNode(node),
        level,
        content: inlineFromBlockContent(node.content),
      };
    }
    case "paragraph":
      return {
        type: "paragraph",
        id: blockIdFromNode(node),
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
        id: blockIdFromNode(node),
        content: merged.length ? merged : [{ type: "text", id: inlineId(), text: "" }],
      };
    }
    case "codeBlock": {
      const text = (node.content ?? [])
        .map((child) => (child.type === "text" ? child.text : ""))
        .join("");
      const language =
        typeof node.attrs?.language === "string" && node.attrs.language.length
          ? node.attrs.language
          : undefined;
      return {
        type: "code_block",
        id: blockIdFromNode(node),
        text,
        ...(language ? { language } : {}),
      };
    }
    case "sceneBreak":
      return { type: "scene_break", id: blockIdFromNode(node) };
    case "taskList": {
      const taskItems: Array<{
        id: string;
        content: ProsaInlineNode[];
        checked?: boolean;
      }> = [];
      for (const child of node.content ?? []) {
        if (child.type !== "taskItem") {
          continue;
        }
        const merged: ProsaInlineNode[] = [];
        for (const itemChild of child.content ?? []) {
          if (itemChild.type === "paragraph") {
            merged.push(...inlineFromBlockContent(itemChild.content));
          }
        }
        taskItems.push({
          id: listItemId(),
          checked: Boolean(child.attrs?.checked),
          content: merged.length ? merged : [{ type: "text", id: inlineId(), text: "" }],
        });
      }
      if (!taskItems.length) {
        return null;
      }
      return {
        type: "list",
        id: blockIdFromNode(node),
        ordered: false,
        task: true,
        items: taskItems,
      };
    }
    case "bulletList":
    case "orderedList": {
      const ordered = node.type === "orderedList";
      const items: { id: string; content: ProsaInlineNode[] }[] = [];
      for (const child of node.content ?? []) {
        if (child.type !== "listItem") {
          continue;
        }
        const merged: ProsaInlineNode[] = [];
        for (const itemChild of child.content ?? []) {
          if (itemChild.type === "paragraph") {
            merged.push(...inlineFromBlockContent(itemChild.content));
          }
        }
        items.push({
          id: listItemId(),
          content: merged.length ? merged : [{ type: "text", id: inlineId(), text: "" }],
        });
      }
      if (!items.length) {
        return null;
      }
      return { type: "list", id: blockIdFromNode(node), ordered, items };
    }
    default:
      return null;
  }
}

function isEmptyParagraphBlock(block: ProsaBlock): boolean {
  if (block.type !== "paragraph") {
    return false;
  }
  return !block.content.some((node) => node.text.trim().length > 0);
}

export function prosaDocumentFromTiptapJson(base: ProsaDocument, doc: JSONContent): ProsaDocument {
  const blocks: ProsaBlock[] = [];
  for (const node of doc.content ?? []) {
    const block = blockFromTiptap(node);
    if (block && !isEmptyParagraphBlock(block)) {
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
    if (mark === "code") marks.push({ type: "code" });
    if (mark === "strike") marks.push({ type: "strike" });
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
        attrs: { level: block.level, ...blockAttrs(block) },
        content: inlineToTiptap(block.content),
      };
    case "paragraph":
      return {
        type: "paragraph",
        attrs: blockAttrs(block),
        content: inlineToTiptap(block.content),
      };
    case "blockquote":
      return {
        type: "blockquote",
        attrs: blockAttrs(block),
        content: [{ type: "paragraph", content: inlineToTiptap(block.content) }],
      };
    case "code_block":
      return {
        type: "codeBlock",
        attrs: { ...blockAttrs(block), ...(block.language ? { language: block.language } : {}) },
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    case "scene_break":
      return { type: "sceneBreak", attrs: blockAttrs(block) };
    case "list":
      if (block.task) {
        return {
          type: "taskList",
          attrs: blockAttrs(block),
          content: block.items.map((item) => ({
            type: "taskItem",
            attrs: { checked: item.checked ?? false },
            content: [{ type: "paragraph", content: inlineToTiptap(item.content) }],
          })),
        };
      }
      return {
        type: block.ordered ? "orderedList" : "bulletList",
        attrs: blockAttrs(block),
        content: block.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: inlineToTiptap(item.content) }],
        })),
      };
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
