/**
 * Canonical markdown source hygiene before persist (does not reflow prose).
 * - Trim trailing spaces/tabs on each line
 * - Collapse runs of 3+ blank lines to a single blank line
 * - Ensure file ends with a single newline when non-empty
 */
export function normalizeMarkdownSource(source: string): string {
  if (!source) {
    return source;
  }

  const lines = source.split("\n").map((line) => line.replace(/[ \t]+$/u, ""));

  const collapsed: string[] = [];
  let blankRun = 0;
  for (const line of lines) {
    const isBlank = line.trim().length === 0;
    if (isBlank) {
      blankRun += 1;
      if (blankRun <= 1) {
        collapsed.push("");
      }
      continue;
    }
    blankRun = 0;
    collapsed.push(line);
  }

  let out = collapsed.join("\n");
  while (out.endsWith("\n\n\n")) {
    out = out.slice(0, -1);
  }
  if (out.length > 0 && !out.endsWith("\n")) {
    out += "\n";
  }
  return out;
}
