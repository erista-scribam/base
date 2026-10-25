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
});
