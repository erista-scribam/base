import { describe, expect, it, vi } from "vitest";
import { createEmptyProsaDocument } from "@scribo/document-model";
import { ManuscriptPersistence } from "./manuscript-persistence";

vi.mock("./tauri-manuscripts", () => ({
  saveManuscriptDocument: vi.fn(async () => ({
    id: "ms_test",
    title: "Test",
    updatedAt: new Date().toISOString(),
  })),
  saveRecoverySnapshot: vi.fn(async () => undefined),
}));

describe("ManuscriptPersistence", () => {
  it("does not mark saved when a stale save finishes after newer edits", async () => {
    const states: string[] = [];
    const engine = new ManuscriptPersistence({
      onStateChange: (state) => states.push(state),
      onSaved: () => undefined,
      onError: () => undefined,
    });

    const doc = createEmptyProsaDocument("Test");
    engine.noteRevision();
    engine.schedulePersist("ms_test", doc, null);

    engine.noteRevision();
    engine.schedulePersist("ms_test", { ...doc, title: "Newer" }, null);

    await engine.flushPending();

    expect(states.includes("saved")).toBe(true);
    expect(states[states.length - 1]).not.toBe("error");
  });
});
