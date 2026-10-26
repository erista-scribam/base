import { describe, expect, it } from "vitest";
import { isProsaManuscriptRelativePath, resolveManuscriptsRelativePath } from "./layout";

describe("layout", () => {
  it("prefers v2 manuscripts dir when present", () => {
    expect(
      resolveManuscriptsRelativePath({ hasV2ManuscriptsDir: true, hasV1ManuscriptsDir: true }),
    ).toBe("contents/canon/manuscripts");
  });

  it("falls back to v1", () => {
    expect(
      resolveManuscriptsRelativePath({ hasV2ManuscriptsDir: false, hasV1ManuscriptsDir: true }),
    ).toBe("content/manuscripts");
  });

  it("defaults new projects to v1 path", () => {
    expect(
      resolveManuscriptsRelativePath({ hasV2ManuscriptsDir: false, hasV1ManuscriptsDir: false }),
    ).toBe("content/manuscripts");
  });

  it("detects prosa manuscript relative paths", () => {
    expect(isProsaManuscriptRelativePath("content/manuscripts/ch.md")).toBe(true);
    expect(isProsaManuscriptRelativePath("contents/canon/manuscripts/a/b.mdprosa")).toBe(true);
    expect(isProsaManuscriptRelativePath("contents/canon/folia/deck.folio")).toBe(false);
  });
});
