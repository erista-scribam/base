import type { ProsaBlock } from "@scribam/document-model";
import { serializeInline } from "./markdown-inline";

function blockStableFingerprint(block: ProsaBlock): string {
  switch (block.type) {
    case "heading":
      return `h:${block.level}:${serializeInline(block.content)}`;
    case "paragraph":
      return `p:${serializeInline(block.content)}`;
    case "blockquote":
      return `q:${serializeInline(block.content)}`;
    case "scene_break":
      return "scene";
    case "code_block":
      return `code:${block.language ?? ""}:${block.text}`;
    case "list": {
      const items = block.items
        .map((item) => `${item.indent ?? 0}:${serializeInline(item.content)}`)
        .join("|");
      return `list:${block.ordered}:${block.task}:${items}`;
    }
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

function isEmptyParagraphBlock(block: ProsaBlock): boolean {
  return (
    block.type === "paragraph" &&
    !block.content.some((node) => node.type === "text" && node.text.trim().length > 0)
  );
}

export function shouldPreserveBlockIdsFromBase(baseBlocks: ProsaBlock[]): boolean {
  if (!baseBlocks.length) {
    return false;
  }
  if (baseBlocks.length === 1 && isEmptyParagraphBlock(baseBlocks[0]!)) {
    return false;
  }
  return true;
}

/** Re-attach stable block ids after parsing author-facing markdown (no HTML comment anchors). */
export function preserveBlockIdsFromBase(
  baseBlocks: ProsaBlock[],
  parsedBlocks: ProsaBlock[],
): ProsaBlock[] {
  if (!shouldPreserveBlockIdsFromBase(baseBlocks)) {
    return parsedBlocks;
  }

  const baseIds = new Set(baseBlocks.map((block) => block.id));
  const unusedBase = [...baseBlocks];

  const takeMatching = (predicate: (block: ProsaBlock) => boolean): string | null => {
    const index = unusedBase.findIndex(predicate);
    if (index < 0) {
      return null;
    }
    const [matched] = unusedBase.splice(index, 1);
    return matched?.id ?? null;
  };

  return parsedBlocks.map((block, index) => {
    if (baseIds.has(block.id)) {
      const existing = unusedBase.findIndex((candidate) => candidate.id === block.id);
      if (existing >= 0) {
        unusedBase.splice(existing, 1);
      }
      return block;
    }

    const fingerprint = blockStableFingerprint(block);
    const byContent = takeMatching(
      (candidate) =>
        candidate.type === block.type && blockStableFingerprint(candidate) === fingerprint,
    );
    if (byContent) {
      return { ...block, id: byContent };
    }

    const positional = baseBlocks[index];
    if (positional && positional.type === block.type) {
      const byPosition = takeMatching((candidate) => candidate.id === positional.id);
      if (byPosition) {
        return { ...block, id: byPosition };
      }
    }

    return block;
  });
}
