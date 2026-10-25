import type {
  ProsaBlock,
  ProsaDocument,
  ProsaInlineNode,
  ProsaInlineMark,
} from "@scribo/document-model";
import { PROSA_SCHEMA_VERSION, validateProsaDocument } from "@scribo/document-model";

function blockId(): string {
  return `blk_${crypto.randomUUID()}`;
}

function inlineId(): string {
  return `inl_${crypto.randomUUID()}`;
}

function serializeInline(nodes: ProsaInlineNode[]): string {
  return nodes
    .map((node) => {
      let text = node.text;
      const marks = node.marks ?? [];
      if (marks.includes("link") && node.href) {
        text = `[${text}](${node.href})`;
      }
      if (marks.includes("bold")) {
        text = `**${text}**`;
      }
      if (marks.includes("italic")) {
        text = `*${text}*`;
      }
      if (marks.includes("underline")) {
        text = `<u>${text}</u>`;
      }
      return text;
    })
    .join("");
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
        lines.push(text.length ? text : "");
        break;
      }
      case "blockquote":
        lines.push(
          serializeInline(block.content)
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n"),
        );
        break;
      case "scene_break":
        lines.push("* * *");
        break;
      default:
        break;
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function parseInlineMarkdown(text: string): ProsaInlineNode[] {
  if (!text) {
    return [{ type: "text", id: inlineId(), text: "" }];
  }

  type Token = { text: string; marks: ProsaInlineMark[]; href?: string };
  const tokens: Token[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|<u>([^<]+)<\/u>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushPlain = (plain: string) => {
    if (plain) {
      tokens.push({ text: plain, marks: [] });
    }
  };

  while ((match = pattern.exec(text)) !== null) {
    pushPlain(text.slice(lastIndex, match.index));
    if (match[2] && match[3]) {
      tokens.push({ text: match[2], marks: ["link"], href: match[3] });
    } else if (match[4]) {
      tokens.push({ text: match[4], marks: ["bold"] });
    } else if (match[5]) {
      tokens.push({ text: match[5], marks: ["italic"] });
    } else if (match[6]) {
      tokens.push({ text: match[6], marks: ["underline"] });
    }
    lastIndex = match.index + match[0].length;
  }
  pushPlain(text.slice(lastIndex));

  if (!tokens.length) {
    return [{ type: "text", id: inlineId(), text }];
  }

  return tokens.map((token) => ({
    type: "text" as const,
    id: inlineId(),
    text: token.text,
    ...(token.marks.length ? { marks: token.marks } : {}),
    ...(token.href ? { href: token.href } : {}),
  }));
}

function isSceneBreakLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "* * *" || trimmed === "***";
}

function parseHeadingLine(line: string): { level: 1 | 2 | 3 | 4 | 5; text: string } | null {
  const match = /^(#{1,5})\s+(.+)$/.exec(line.trim());
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    level: match[1].length as 1 | 2 | 3 | 4 | 5,
    text: match[2].trim(),
  };
}

export function markdownToProsaDocument(base: ProsaDocument, markdown: string): ProsaDocument {
  const blocks: ProsaBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isSceneBreakLine(line)) {
      blocks.push({ type: "scene_break", id: blockId() });
      index += 1;
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
        quoteLines.push(quoteLine.replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({
        type: "blockquote",
        id: blockId(),
        content: parseInlineMarkdown(quoteLines.join("\n")),
      });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const paragraphLine = lines[index] ?? "";
      if (!paragraphLine.trim()) {
        break;
      }
      if (
        isSceneBreakLine(paragraphLine) ||
        parseHeadingLine(paragraphLine) ||
        paragraphLine.trimStart().startsWith(">")
      ) {
        break;
      }
      paragraphLines.push(paragraphLine);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      id: blockId(),
      content: parseInlineMarkdown(paragraphLines.join(" ")),
    });
  }

  if (!blocks.length) {
    blocks.push({
      type: "paragraph",
      id: blockId(),
      content: [{ type: "text", id: inlineId(), text: "" }],
    });
  }

  return validateProsaDocument({
    schemaVersion: PROSA_SCHEMA_VERSION,
    id: base.id,
    title: base.title,
    blocks,
  });
}
