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

export function markdownToProsaDocument(base: ProsaDocument, markdown: string): ProsaDocument {
  const blocks: ProsaBlock[] = [];
  const chunks = markdown.replace(/\r\n/g, "\n").split(/\n\n+/);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed === "* * *" || trimmed === "***") {
      blocks.push({ type: "scene_break", id: blockId() });
      continue;
    }

    const headingMatch = /^(#{1,5})\s+(.+)$/s.exec(trimmed);
    if (headingMatch?.[1] && headingMatch[2]) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5;
      blocks.push({
        type: "heading",
        id: blockId(),
        level,
        content: parseInlineMarkdown(headingMatch[2].trim()),
      });
      continue;
    }

    if (trimmed.split("\n").every((line) => line.startsWith("> "))) {
      const quote = trimmed
        .split("\n")
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n");
      blocks.push({
        type: "blockquote",
        id: blockId(),
        content: parseInlineMarkdown(quote),
      });
      continue;
    }

    blocks.push({
      type: "paragraph",
      id: blockId(),
      content: parseInlineMarkdown(trimmed.replace(/\n/g, " ")),
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
