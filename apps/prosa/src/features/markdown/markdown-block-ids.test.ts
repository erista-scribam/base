import { describe, expect, it } from "vitest";
import { isBlockIdCommentLine, stripBlockIdComments } from "./markdown-block-ids";

describe("markdown-block-ids", () => {
  it("strips scribam block comment lines", () => {
    const raw = `<!-- scribam:block=blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee -->
# Title

Paragraph`;
    expect(stripBlockIdComments(raw)).toBe(`# Title

Paragraph`);
    expect(
      isBlockIdCommentLine("<!-- scribam:block=blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee -->"),
    ).toBe(true);
  });
});
