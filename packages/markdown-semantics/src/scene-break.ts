export function isSceneBreakLineRaw(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "* * *" || trimmed === "***" || trimmed === "---" || trimmed === "___";
}
