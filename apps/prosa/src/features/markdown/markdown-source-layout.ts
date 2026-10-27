import { isSceneBreakLineRaw } from "@scribam/markdown-semantics";

export { isSceneBreakLineRaw };

/** Strip old iA-style leading spaces from source lines (visual indent is CSS-only now). */
export function stripLegacySourceIndent(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.trim()) {
        return line;
      }
      if (/^#{1,6}\s/.test(line.trimStart())) {
        return line.trimStart();
      }
      if (line.trimStart().startsWith(">")) {
        return line.trimStart();
      }
      const trimmed = line.trim();
      if (isSceneBreakLineRaw(trimmed)) {
        return trimmed;
      }
      return line.replace(/^ {1,3}/, "");
    })
    .join("\n");
}
