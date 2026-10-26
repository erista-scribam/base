import type { ProsaBlock, ProsaDocument, ProsaListBlock } from "@scribo/document-model";
import { PROSA_SCHEMA_VERSION, tryValidateProsaDocument } from "@scribo/document-model";
import { isSceneBreakLineRaw, stripLegacySourceIndent } from "./markdown-source-layout";
import { parseInlineMarkdown, serializeInline } from "./markdown-inline";
import { formatBlockIdComment, parseBlockIdComment } from "./markdown-block-ids";

function blockId(): string {
  return `blk_${crypto.randomUUID()}`;
}

function inlineId(): string {
  return `inl_${crypto.randomUUID()}`;
}

function listItemId(): string {
  return `itm_${crypto.randomUUID()}`;
}

function emptyParagraphBlock(): ProsaBlock {
  return {
    type: "paragraph",
    id: blockId(),
    content: [{ type: "text", id: inlineId(), text: "" }],
  };
}

function blockToPlainParagraph(block: ProsaBlock): ProsaBlock {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "blockquote":
      return {
        type: "paragraph",
        id: block.id,
        content: block.content.length
          ? block.content
          : [{ type: "text", id: inlineId(), text: "" }],
      };
    case "code_block":
      return {
        type: "paragraph",
        id: block.id,
        content: [{ type: "text", id: inlineId(), text: block.text }],
      };
    case "scene_break":
      return {
        type: "paragraph",
        id: block.id,
        content: [{ type: "text", id: inlineId(), text: "* * *" }],
      };
    case "list": {
      const text = block.items
        .map((item) => serializeInline(item.content))
        .filter(Boolean)
        .join("\n");
      return {
        type: "paragraph",
        id: block.id,
        content: [{ type: "text", id: inlineId(), text: text || "" }],
      };
    }
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

function coerceMarkdownDocument(base: ProsaDocument, blocks: ProsaBlock[]): ProsaDocument {
  const candidate = {
    schemaVersion: PROSA_SCHEMA_VERSION,
    id: base.id,
    title: base.title,
    blocks: blocks.length ? blocks : [emptyParagraphBlock()],
  };
  const parsed = tryValidateProsaDocument(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  const salvagedBlocks: ProsaBlock[] = [];
  for (const block of candidate.blocks) {
    const single = tryValidateProsaDocument({ ...candidate, blocks: [block] });
    if (single.success) {
      salvagedBlocks.push(single.data.blocks[0]!);
    } else {
      salvagedBlocks.push(blockToPlainParagraph(block));
    }
  }

  const salvaged = tryValidateProsaDocument({ ...candidate, blocks: salvagedBlocks });
  if (salvaged.success) {
    return salvaged.data;
  }

  const fallback = tryValidateProsaDocument({
    ...candidate,
    blocks: [emptyParagraphBlock()],
  });
  return fallback.success ? fallback.data : base;
}

type ParsedListLine = {
  ordered: boolean;
  task: boolean;
  indent: number;
  text: string;
  checked?: boolean;
};

function listIndentSpaces(line: string): number {
  const match = /^(\s*)/.exec(line);
  return match?.[1]?.length ?? 0;
}

function parseListLine(line: string): ParsedListLine | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const taskBullet = /^[-*+]\s+\[([ xX])\]\s+(.+)$/.exec(trimmed);
  if (taskBullet?.[1] && taskBullet[2]) {
    return {
      ordered: false,
      task: true,
      indent: Math.floor(listIndentSpaces(line) / 2),
      checked: taskBullet[1].toLowerCase() === "x",
      text: taskBullet[2],
    };
  }

  const taskOrdered = /^\d+\.\s+\[([ xX])\]\s+(.+)$/.exec(trimmed);
  if (taskOrdered?.[1] && taskOrdered[2]) {
    return {
      ordered: true,
      task: true,
      indent: Math.floor(listIndentSpaces(line) / 2),
      checked: taskOrdered[1].toLowerCase() === "x",
      text: taskOrdered[2],
    };
  }

  const ordered = /^(\d+)\.\s+(.+)$/.exec(trimmed);
  if (ordered?.[2]) {
    return {
      ordered: true,
      task: false,
      indent: Math.floor(listIndentSpaces(line) / 2),
      text: ordered[2],
    };
  }

  const bullet = /^[-*+]\s+(.+)$/.exec(trimmed);
  if (bullet?.[1]) {
    return {
      ordered: false,
      task: false,
      indent: Math.floor(listIndentSpaces(line) / 2),
      text: bullet[1],
    };
  }

  return null;
}

function listLinesCompatible(a: ParsedListLine, b: ParsedListLine): boolean {
  return a.ordered === b.ordered && a.task === b.task;
}

function parseHeadingLine(line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null {
  const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    level: match[1].length as 1 | 2 | 3 | 4 | 5 | 6,
    text: match[2].trim(),
  };
}

function pushBlockWithId(lines: string[], blockId: string, contentLines: string[]): void {
  lines.push(formatBlockIdComment(blockId));
  lines.push(...contentLines);
}

export function prosaDocumentToMarkdown(document: ProsaDocument): string {
  const lines: string[] = [];
  for (const block of document.blocks) {
    switch (block.type) {
      case "heading":
        pushBlockWithId(lines, block.id, [
          `${"#".repeat(block.level)} ${serializeInline(block.content)}`,
        ]);
        break;
      case "paragraph": {
        const text = serializeInline(block.content);
        if (text.length) {
          pushBlockWithId(lines, block.id, [text]);
        }
        break;
      }
      case "blockquote": {
        const quoteLines: string[] = [];
        for (const line of serializeInline(block.content).split("\n")) {
          quoteLines.push(`> ${line}`);
        }
        pushBlockWithId(lines, block.id, quoteLines);
        break;
      }
      case "scene_break":
        pushBlockWithId(lines, block.id, ["* * *"]);
        break;
      case "code_block": {
        const lang = block.language ?? "";
        pushBlockWithId(lines, block.id, [`\`\`\`${lang}`.trimEnd(), block.text, "```"]);
        break;
      }
      case "list": {
        const listLines: string[] = [];
        block.items.forEach((item, itemIndex) => {
          const pad = "  ".repeat(item.indent ?? 0);
          const text = serializeInline(item.content);
          if (block.task) {
            const box = item.checked ? "[x]" : "[ ]";
            const marker = block.ordered ? `${itemIndex + 1}. ${box}` : `- ${box}`;
            listLines.push(`${pad}${marker} ${text}`);
          } else if (block.ordered) {
            listLines.push(`${pad}${itemIndex + 1}. ${text}`);
          } else {
            listLines.push(`${pad}- ${text}`);
          }
        });
        pushBlockWithId(lines, block.id, listLines);
        break;
      }
      default:
        break;
    }
  }
  return lines.join("\n");
}

export function markdownToProsaDocument(base: ProsaDocument, markdown: string): ProsaDocument {
  const blocks: ProsaBlock[] = [];
  const lines = stripLegacySourceIndent(markdown.replace(/\r\n/g, "\n")).split("\n");
  let index = 0;
  let pendingBlockId: string | null = null;

  const takeBlockId = (): string => {
    const id = pendingBlockId ?? blockId();
    pendingBlockId = null;
    return id;
  };

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const commentId = parseBlockIdComment(line);
    if (commentId) {
      pendingBlockId = commentId;
      index += 1;
      continue;
    }

    if (isSceneBreakLineRaw(line.trim())) {
      blocks.push({ type: "scene_break", id: takeBlockId() });
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      const language = line.trimStart().slice(3).trim();
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index]?.trimStart().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({
        type: "code_block",
        id: takeBlockId(),
        text: codeLines.join("\n"),
        ...(language ? { language } : {}),
      });
      continue;
    }

    const heading = parseHeadingLine(line);
    if (heading) {
      blocks.push({
        type: "heading",
        id: takeBlockId(),
        level: heading.level,
        content: parseInlineMarkdown(heading.text),
      });
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const quoteLine = lines[index] ?? "";
        if (!quoteLine.trim()) {
          break;
        }
        if (!quoteLine.trimStart().startsWith(">")) {
          break;
        }
        quoteLines.push(quoteLine.trimStart().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({
        type: "blockquote",
        id: takeBlockId(),
        content: parseInlineMarkdown(quoteLines.join("\n")),
      });
      continue;
    }

    const firstListLine = parseListLine(line);
    if (firstListLine) {
      const listBlock: ProsaListBlock = {
        type: "list",
        id: takeBlockId(),
        ordered: firstListLine.ordered,
        task: firstListLine.task,
        items: [
          {
            id: listItemId(),
            indent: firstListLine.indent,
            ...(firstListLine.task ? { checked: firstListLine.checked ?? false } : {}),
            content: parseInlineMarkdown(firstListLine.text),
          },
        ],
      };
      index += 1;
      while (index < lines.length) {
        const nextLine = lines[index] ?? "";
        const parsed = parseListLine(nextLine);
        if (!parsed || !listLinesCompatible(firstListLine, parsed)) {
          break;
        }
        listBlock.items.push({
          id: listItemId(),
          indent: parsed.indent,
          ...(parsed.task ? { checked: parsed.checked ?? false } : {}),
          content: parseInlineMarkdown(parsed.text),
        });
        index += 1;
      }
      blocks.push(listBlock);
      continue;
    }

    blocks.push({
      type: "paragraph",
      id: takeBlockId(),
      content: parseInlineMarkdown(line.trim()),
    });
    index += 1;
  }

  return coerceMarkdownDocument(base, blocks);
}
