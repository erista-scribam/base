import { describe, expect, it } from "vitest";
import {
  displayMarkdownFileName,
  displayMarkdownRepoPath,
  isMarkdownRepoPath,
  normalizeNewManuscriptTitle,
} from "./manuscript-file-name";

describe("manuscript-file-name", () => {
  it("strips markdown extensions for display", () => {
    expect(displayMarkdownFileName("chapter.md")).toBe("chapter");
    expect(displayMarkdownFileName("Draft.MARKDOWN")).toBe("Draft");
  });

  it("formats repo paths without extension", () => {
    expect(displayMarkdownRepoPath("content/manuscripts/foo.md")).toBe("content/manuscripts/foo");
  });

  it("normalizes new file titles", () => {
    expect(normalizeNewManuscriptTitle("  Untitled.md  ")).toBe("Untitled");
  });

  it("detects markdown repo paths", () => {
    expect(isMarkdownRepoPath("a.md")).toBe(true);
    expect(isMarkdownRepoPath("readme.txt")).toBe(false);
  });
});
