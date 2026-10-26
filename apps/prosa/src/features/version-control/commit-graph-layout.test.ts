import { describe, expect, it } from "vitest";
import { computeCommitGraph } from "./commit-graph-layout";

describe("computeCommitGraph", () => {
  it("uses one column for linear history", () => {
    const layout = computeCommitGraph([
      { hash: "c", parents: ["b"] },
      { hash: "b", parents: ["a"] },
      { hash: "a", parents: [] },
    ]);
    expect(layout.columns).toBe(1);
    expect(layout.rows[0]?.col).toBe(0);
  });

  it("opens a second column for a branch fork", () => {
    const layout = computeCommitGraph([
      { hash: "alt", parents: ["fork"] },
      { hash: "main", parents: ["fork"] },
      { hash: "fork", parents: ["root"] },
      { hash: "root", parents: [] },
    ]);
    expect(layout.columns).toBeGreaterThanOrEqual(2);
    const colors = new Set(layout.rows.map((row) => row.color));
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });
});
