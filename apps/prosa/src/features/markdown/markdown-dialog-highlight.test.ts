import { describe, expect, it } from "vitest";

const DIALOG_QUOTED = /"[^"\n]+"|\u201c[^\u201d\n]+\u201d/g;

describe("dialog quote pattern", () => {
  it("matches straight double-quoted spans", () => {
    const line = 'She said "Hello there" and left.';
    const matches = [...line.matchAll(DIALOG_QUOTED)].map((m) => m[0]);
    expect(matches).toEqual(['"Hello there"']);
  });

  it("matches curly double-quoted spans", () => {
    const line = "She said \u201cHello there\u201d and left.";
    const matches = [...line.matchAll(DIALOG_QUOTED)].map((m) => m[0]);
    expect(matches).toEqual(["\u201cHello there\u201d"]);
  });
});
