import type { ProsaInlineMark, ProsaInlineNode } from "@scribam/document-model";

function inlineId(): string {
  return `inl_${crypto.randomUUID()}`;
}

type InlineToken = { text: string; marks: ProsaInlineMark[]; href?: string };

const INLINE_PATTERN =
  /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|~~([^~]+)~~|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|<u>([^<]+)<\/u>)/g;

export function parseInlineMarkdown(text: string): ProsaInlineNode[] {
  if (!text) {
    return [{ type: "text", id: inlineId(), text: "" }];
  }

  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushPlain = (plain: string) => {
    if (plain) {
      tokens.push({ text: plain, marks: [] });
    }
  };

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    pushPlain(text.slice(lastIndex, match.index));
    if (match[2] && match[3]?.length) {
      tokens.push({ text: match[2], marks: ["link"], href: match[3] });
    } else if (match[4]) {
      tokens.push({ text: match[4], marks: ["code"] });
    } else if (match[5]) {
      tokens.push({ text: match[5], marks: ["strike"] });
    } else if (match[6]) {
      tokens.push({ text: match[6], marks: ["bold"] });
    } else if (match[7]) {
      tokens.push({ text: match[7], marks: ["bold"] });
    } else if (match[8]) {
      tokens.push({ text: match[8], marks: ["italic"] });
    } else if (match[9]) {
      tokens.push({ text: match[9], marks: ["italic"] });
    } else if (match[10]) {
      tokens.push({ text: match[10], marks: ["underline"] });
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

export function serializeInline(nodes: ProsaInlineNode[]): string {
  return nodes
    .map((node) => {
      let text = node.text;
      const marks = node.marks ?? [];
      if (marks.includes("code")) {
        text = `\`${text}\``;
      }
      if (marks.includes("strike")) {
        text = `~~${text}~~`;
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
      if (marks.includes("link") && node.href) {
        text = `[${text}](${node.href})`;
      }
      return text;
    })
    .join("");
}
