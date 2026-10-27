import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DIALOG_QUOTED_PATTERN } from "./dialog";
import { MARKDOWN_SEMANTIC_CM_CLASS } from "./kinds";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const TOKENS_CSS = join(repoRoot, "apps/prosa/src/styles/tokens.css");
const BRAND_CSS = join(repoRoot, "apps/prosa/src/styles/brand.css");
const SEMANTICS_CSS = join(repoRoot, "apps/prosa/src/styles/markdown-source-semantics.css");

describe("prosa markdown semantics CSS contract", () => {
  it("defines locked dialog color in tokens.css (light and dark)", () => {
    const css = readFileSync(TOKENS_CSS, "utf8");
    expect(css).toMatch(/--scribam-md-dialog-fg:\s*#[0-9a-f]{6}/i);
    const darkBlock = css.slice(css.indexOf('[data-theme="dark"]'));
    expect(darkBlock).toMatch(/--scribam-md-dialog-fg:\s*#[0-9a-f]{6}/i);
  });

  it("does not override dialog color in brand.css", () => {
    const css = readFileSync(BRAND_CSS, "utf8");
    expect(css).not.toMatch(/--scribam-md-dialog-fg/);
  });

  it("routes dialog styling through markdown-source-semantics.css", () => {
    const css = readFileSync(SEMANTICS_CSS, "utf8");
    expect(css).toContain(MARKDOWN_SEMANTIC_CM_CLASS.dialog);
    expect(css).toContain("--scribam-md-dialog-fg");
    expect(css).toContain("span.cm-md-tok-dialog *");
  });

  it("keeps dialog regex compatible with contractions", () => {
    const line = `"I don't see."`;
    const re = new RegExp(DIALOG_QUOTED_PATTERN.source, "g");
    const match = re.exec(line);
    expect(match?.[0]).toBe(line);
  });
});
