const BLOCK_ID_PATTERN = /^blk_[0-9a-f-]+$/i;

/** HTML comment embedded in sources to preserve block identity. */
export function formatBlockIdComment(blockId: string): string {
  return `<!-- scribo:block=${blockId} -->`;
}

export function parseBlockIdComment(line: string): string | null {
  const trimmed = line.trim();
  const match = /^<!--\s*scribo:block=(\S+)\s*-->$/u.exec(trimmed);
  if (!match?.[1] || !BLOCK_ID_PATTERN.test(match[1])) {
    return null;
  }
  return match[1];
}

export function isBlockIdCommentLine(line: string): boolean {
  return parseBlockIdComment(line) != null;
}

/** Writer-visible source: strip machine anchors while keeping them on disk. */
export function stripBlockIdComments(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (!isBlockIdCommentLine(line)) {
      kept.push(line);
    }
  }
  return kept.join("\n");
}
