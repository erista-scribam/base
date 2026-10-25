/** Strip old iA-style leading spaces from source lines (visual indent is CSS-only now). */
export function stripLegacySourceIndent(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.trim()) {
        return line;
      }
      if (/^#{1,5}\s/.test(line.trimStart())) {
        return line.trimStart();
      }
      if (line.trimStart().startsWith(">")) {
        return line.trimStart();
      }
      const trimmed = line.trim();
      if (trimmed === "* * *" || trimmed === "***") {
        return trimmed;
      }
      return line.replace(/^ {1,3}/, "");
    })
    .join("\n");
}

export function isSceneBreakLineRaw(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "* * *" || trimmed === "***";
}
