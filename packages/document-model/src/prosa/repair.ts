/** Best-effort fixes for documents saved by older builds or half-synced editors. */
export function repairProsaDocumentInput(input: unknown): unknown {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const doc = input as Record<string, unknown>;
  if (!Array.isArray(doc.blocks)) {
    return input;
  }

  const blocks = doc.blocks
    .map(repairBlock)
    .filter((block): block is Record<string, unknown> => block !== null);

  return {
    ...doc,
    blocks: blocks.length
      ? blocks
      : [
          {
            type: "paragraph",
            id: "blk_repaired",
            content: [{ type: "text", id: "inl_repaired", text: "" }],
          },
        ],
  };
}

function repairBlock(block: unknown): Record<string, unknown> | null {
  if (typeof block !== "object" || block === null) {
    return null;
  }

  const record = block as Record<string, unknown>;
  const type = record.type;

  if (type === "list") {
    const items = Array.isArray(record.items)
      ? record.items
          .map(repairListItem)
          .filter((item): item is Record<string, unknown> => item !== null)
      : [];
    if (!items.length) {
      return {
        type: "paragraph",
        id: typeof record.id === "string" ? record.id : "blk_repaired",
        content: [{ type: "text", id: "inl_repaired", text: "" }],
      };
    }
    const ordered = typeof record.ordered === "boolean" ? record.ordered : true;
    const task = typeof record.task === "boolean" ? record.task : undefined;
    return {
      type: "list",
      id: typeof record.id === "string" && record.id.length ? record.id : "blk_repaired",
      ordered,
      ...(task !== undefined ? { task } : {}),
      items,
    };
  }

  if (type === "code_block") {
    return {
      type: "code_block",
      id: typeof record.id === "string" && record.id.length ? record.id : "blk_repaired",
      text: typeof record.text === "string" ? record.text : "",
      ...(typeof record.language === "string" && record.language.length
        ? { language: record.language }
        : {}),
    };
  }

  if (type === "heading" || type === "paragraph" || type === "blockquote") {
    return {
      ...record,
      content: repairInlineContent(record.content),
    };
  }

  if (type === "scene_break") {
    return record;
  }

  return null;
}

function repairListItem(item: unknown): Record<string, unknown> | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const record = item as Record<string, unknown>;
  return {
    id:
      typeof record.id === "string" && record.id.length ? record.id : `itm_${crypto.randomUUID()}`,
    content: repairInlineContent(record.content),
  };
}

function repairInlineContent(content: unknown): Record<string, unknown>[] {
  if (!Array.isArray(content) || !content.length) {
    return [{ type: "text", id: "inl_repaired", text: "" }];
  }

  const repaired = content
    .map(repairInlineNode)
    .filter((node): node is Record<string, unknown> => node !== null);

  return repaired.length ? repaired : [{ type: "text", id: "inl_repaired", text: "" }];
}

function repairInlineNode(node: unknown): Record<string, unknown> | null {
  if (typeof node !== "object" || node === null) {
    return null;
  }

  const record = node as Record<string, unknown>;
  if (record.type !== "text") {
    return null;
  }

  const allowedMarks = new Set(["bold", "italic", "underline", "link", "code", "strike"]);
  const marks = Array.isArray(record.marks)
    ? record.marks.filter(
        (mark): mark is "bold" | "italic" | "underline" | "link" =>
          typeof mark === "string" && allowedMarks.has(mark),
      )
    : undefined;
  const href = typeof record.href === "string" ? record.href : undefined;
  const hasLinkMark = marks?.includes("link") ?? false;
  const hasValidHref = Boolean(href?.length);

  let nextMarks = marks;
  let nextHref = href;

  if (hasLinkMark && !hasValidHref) {
    nextMarks = marks?.filter((mark) => mark !== "link");
    nextHref = undefined;
  } else if (!hasLinkMark && hasValidHref) {
    nextHref = undefined;
  }

  const normalized: Record<string, unknown> = {
    type: "text",
    id: typeof record.id === "string" && record.id.length ? record.id : "inl_repaired",
    text: typeof record.text === "string" ? record.text : "",
  };

  if (nextMarks?.length) {
    normalized.marks = nextMarks;
  }
  if (nextMarks?.includes("link") && nextHref) {
    normalized.href = nextHref;
  }

  return normalized;
}
