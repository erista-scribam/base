/** Characters that may immediately follow sentence-ending `.!?` (e.g. `"` after `."`). */
const CLOSE_AFTER_SENTENCE_END = new Set(['"', "'", ")", "]", "\u2019", "\u201d"]);

function advancePastSentenceEndSuffix(text: string, index: number): number {
  let i = index;
  while (i < text.length && CLOSE_AFTER_SENTENCE_END.has(text[i] ?? "")) {
    i += 1;
  }
  return i;
}

function skipLeadingWhitespace(text: string, from: number): number {
  while (from < text.length && /\s/u.test(text[from] ?? "")) {
    from += 1;
  }
  return from;
}

function isSentenceEndChar(ch: string): boolean {
  return ch === "." || ch === "!" || ch === "?";
}

/** Active sentence range within a single line (iA-style: `.!?` + newline boundaries). */
export function sentenceRangeAt(text: string, offset: number): { from: number; to: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let from = clamped;
  let to = clamped;

  while (from > 0) {
    const ch = text[from - 1] ?? "";
    if (ch === "\n" || isSentenceEndChar(ch)) {
      from = advancePastSentenceEndSuffix(text, from);
      from = skipLeadingWhitespace(text, from);
      break;
    }
    from -= 1;
  }
  if (from === 0) {
    from = skipLeadingWhitespace(text, from);
  }

  while (to < text.length) {
    const ch = text[to] ?? "";
    if (ch === "\n") {
      break;
    }
    if (isSentenceEndChar(ch)) {
      to += 1;
      to = advancePastSentenceEndSuffix(text, to);
      break;
    }
    to += 1;
  }

  if (to <= from) {
    return { from: clamped, to: Math.min(text.length, clamped + 1) };
  }
  return { from, to };
}
