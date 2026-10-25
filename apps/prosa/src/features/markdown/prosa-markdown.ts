import type { ProsaBlock, ProsaDocument, ProsaListBlock } from "@scribo/document-model";
import { PROSA_SCHEMA_VERSION, tryValidateProsaDocument } from "@scribo/document-model";
import { isSceneBreakLineRaw, stripLegacySourceIndent } from "./markdown-source-layout";
import { parseInlineMarkdown, serializeInline } from "./markdown-inline";

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
  return base;
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

function isStructuralLine(line: string): boolean {
  if (!line.trim()) {
    return false;
  }
  if (isSceneBreakLineRaw(line)) {
    return true;
  }
  if (parseHeadingLine(line)) {
    return true;
  }
  if (line.trimStart().startsWith(">")) {
    return true;
  }
  if (parseListLine(line)) {
    return true;
  }
  if (line.trimStart().startsWith("```")) {
    return true;
  }
  return false;
}

export function prosaDocumentToMarkdown(document: ProsaDocument): string {
  const lines: string[] = [];
  for (const block of document.blocks) {
    switch (block.type) {
      case "heading":
        lines.push(`${"#".repeat(block.level)} ${serializeInline(block.content)}`);
        break;
      case "paragraph": {
        const text = serializeInline(block.content);
        if (text.length) {
          lines.push(text);
        }
        break;
      }
      case "blockquote":
        for (const line of serializeInline(block.content).split("\n")) {
          lines.push(`> ${line}`);
        }
        break;
      case "scene_break":
        lines.push("* * *");
        break;
      case "code_block": {
        const lang = block.language ?? "";
        lines.push(`\`\`\`${lang}`.trimEnd());
        lines.push(block.text);
        lines.push("```");
        break;
      }
      case "list":
        block.items.forEach((item, itemIndex) => {
          const pad = "  ".repeat(item.indent ?? 0);
          const text = serializeInline(item.content);
          if (block.task) {
            const box = item.checked ? "[x]" : "[ ]";
            const marker = block.ordered ? `${itemIndex + 1}. ${box}` : `- ${box}`;
            lines.push(`${pad}${marker} ${text}`);
          } else if (block.ordered) {
            lines.push(`${pad}${itemIndex + 1}. ${text}`);
          } else {
            lines.push(`${pad}- ${text}`);
          }
        });
        break;
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

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isSceneBreakLineRaw(line.trim())) {
      blocks.push({ type: "scene_break", id: blockId() });
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
        id: blockId(),
        text: codeLines.join("\n"),
        ...(language ? { language } : {}),
      });
      continue;
    }

    const heading = parseHeadingLine(line);
    if (heading) {
      blocks.push({
        type: "heading",
        id: blockId(),
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
        id: blockId(),
        content: parseInlineMarkdown(quoteLines.join("\n")),
      });
      continue;
    }

    const firstListLine = parseListLine(line);
    if (firstListLine) {
      const listBlock: ProsaListBlock = {
        type: "list",
        id: blockId(),
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

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const paragraphLine = lines[index] ?? "";
      if (!paragraphLine.trim()) {
        break;
      }
      if (isStructuralLine(paragraphLine)) {
        break;
      }
      paragraphLines.push(paragraphLine.trim());
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      id: blockId(),
      content: parseInlineMarkdown(paragraphLines.join(" ")),
    });
  }

  return coerceMarkdownDocument(base, blocks);
}
