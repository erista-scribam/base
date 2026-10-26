import { describe, expect, it } from "vitest";
import {
  displayProsaManuscriptFileName,
  isProsaManuscriptFileName,
  normalizeNewManuscriptTitleInput,
} from "./format";

describe("mdprosa format", () => {
  it("accepts md and mdprosa", () => {
    expect(isProsaManuscriptFileName("chapter.md")).toBe(true);
    expect(isProsaManuscriptFileName("chapter.mdprosa")).toBe(true);
    expect(isProsaManuscriptFileName("deck.folia")).toBe(false);
  });

  it("strips extensions for display", () => {
    expect(displayProsaManuscriptFileName("Part One.mdprosa")).toBe("Part One");
    expect(normalizeNewManuscriptTitleInput("Draft.md")).toBe("Draft");
  });
});
