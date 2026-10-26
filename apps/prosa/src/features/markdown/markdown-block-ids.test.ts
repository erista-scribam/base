import { describe, expect, it } from "vitest";
import { isBlockIdCommentLine, stripBlockIdComments } from "./markdown-block-ids";

describe("markdown-block-ids", () => {
  it("strips scribo block comment lines", () => {
    const raw = `<!-- scribo:block=blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee -->
# Title

Paragraph`;
    expect(stripBlockIdComments(raw)).toBe(`# Title

Paragraph`);
    expect(
      isBlockIdCommentLine("<!-- scribo:block=blk_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee -->"),
    ).toBe(true);
  });
});
