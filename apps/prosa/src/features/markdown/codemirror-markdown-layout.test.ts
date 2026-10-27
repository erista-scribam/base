import { describe, expect, it } from "vitest";
import { lineMarkerMeta } from "./codemirror-markdown-layout";

describe("lineMarkerMeta", () => {
  it("classifies scene breaks before bullet syntax", () => {
    expect(lineMarkerMeta("* * *")).toEqual({ kind: "break", markerCh: 0 });
    expect(lineMarkerMeta("***")).toEqual({ kind: "break", markerCh: 0 });
    expect(lineMarkerMeta("---")).toEqual({ kind: "break", markerCh: 0 });
  });

  it("still classifies real bullet lines as lists", () => {
    expect(lineMarkerMeta("- item").kind).toBe("list");
    expect(lineMarkerMeta("* item").kind).toBe("list");
  });

  it("uses a fixed quote gutter width so consecutive quote lines align", () => {
    expect(lineMarkerMeta("> one")).toEqual({
      kind: "quote",
      markerCh: 2,
      syntaxMarkerLen: 2,
    });
    expect(lineMarkerMeta(">two")).toEqual({
      kind: "quote",
      markerCh: 2,
      syntaxMarkerLen: 1,
    });
  });
});
