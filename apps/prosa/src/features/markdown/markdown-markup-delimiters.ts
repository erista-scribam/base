import { isSceneBreakLineRaw } from "./markdown-source-layout";

export type TextRange = { from: number; to: number };

/** Visible syntax only — not word content. See docs/specs/markdown-source-semantics.md */
export function markupDelimiterRangesInLine(text: string): TextRange[] {
  if (isSceneBreakLineRaw(text.trim())) {
    return [];
  }

  const ranges: TextRange[] = [];
  const push = (from: number, to: number) => {
    if (to > from) {
      ranges.push({ from, to });
    }
  };

  let match: RegExpExecArray | null;

  const codeRe = /`([^`\n]+)`/g;
  while ((match = codeRe.exec(text)) !== null) {
    push(match.index, match.index + 1);
    push(match.index + match[0].length - 1, match.index + match[0].length);
  }

  for (const pattern of [/\*\*/g, /__/g, /~~/g]) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      push(match.index, match.index + match[0].length);
    }
  }

  for (const tag of ["<u>", "</u>"] as const) {
    let index = 0;
    while ((index = text.indexOf(tag, index)) >= 0) {
      push(index, index + tag.length);
      index += tag.length;
    }
  }

  const emOpen = /(?<!\*)\*(?!\*)(?=\S)/g;
  while ((match = emOpen.exec(text)) !== null) {
    const from = match.index;
    if (from === 0 && text[1] === " ") {
      continue;
    }
    push(from, from + 1);
  }

  const emClose = /(?<=\S)(?<!\*)\*(?!\*)/g;
  while ((match = emClose.exec(text)) !== null) {
    push(match.index, match.index + 1);
  }

  const emUnderOpen = /(?<!_)_(?!_)(?=\S)/g;
  while ((match = emUnderOpen.exec(text)) !== null) {
    push(match.index, match.index + 1);
  }

  const emUnderClose = /(?<=\S)(?<!_)_(?!_)/g;
  while ((match = emUnderClose.exec(text)) !== null) {
    push(match.index, match.index + 1);
  }

  ranges.sort((a, b) => a.from - b.from || a.to - b.to);
  return ranges;
}
