import { describe, expect, it } from "vitest";
import { createEmptyProsaDocument } from "@scribam/document-model";
import { resolveRecoveryOnOpen } from "./recovery-policy";

describe("resolveRecoveryOnOpen", () => {
  it("keeps saved document when recovery is older", () => {
    const saved = createEmptyProsaDocument("Saved");
    const savedParagraph = saved.blocks[0];
    if (savedParagraph?.type === "paragraph") {
      savedParagraph.content[0]!.text = "saved";
    }
    const recoveryDoc = createEmptyProsaDocument("Recovery");
    const recoveryParagraph = recoveryDoc.blocks[0];
    if (recoveryParagraph?.type === "paragraph") {
      recoveryParagraph.content[0]!.text = "recovery";
    }

    const decision = resolveRecoveryOnOpen(saved, "2026-01-02T00:00:00.000Z", {
      document: recoveryDoc,
      capturedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(decision.kind).toBe("use_saved");
    expect("reason" in decision && decision.reason).toBe("recovery_older");
  });

  it("uses validated recovery when newer and different", () => {
    const saved = createEmptyProsaDocument("Saved");
    const savedParagraph = saved.blocks[0];
    if (savedParagraph?.type === "paragraph") {
      savedParagraph.content[0]!.text = "saved";
    }
    const recoveryDoc = createEmptyProsaDocument("Recovery");
    const recoveryParagraph = recoveryDoc.blocks[0];
    if (recoveryParagraph?.type === "paragraph") {
      recoveryParagraph.content[0]!.text = "recovery";
    }

    const decision = resolveRecoveryOnOpen(saved, "2026-01-01T00:00:00.000Z", {
      document: recoveryDoc,
      capturedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(decision.kind).toBe("use_recovery");
    if (decision.kind === "use_recovery") {
      const block = decision.document.blocks[0];
      expect(block?.type === "paragraph" ? block.content[0]?.text : "").toBe("recovery");
    }
  });
});
