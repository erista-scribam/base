import { EditorSelection, EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { planMarkdownEnter } from "./markdown-keyboard";

function applyEnter(doc: string, head: number): { doc: string; head: number } {
  const state = EditorState.create({ doc, selection: EditorSelection.cursor(head) });
  const plan = planMarkdownEnter(state);
  const next = state.update(plan).state;
  return { doc: next.doc.toString(), head: next.selection.main.head };
}

describe("markdown source Enter (iA Writer, line-prefix model)", () => {
  it("continues blockquote with > on Return", () => {
    const source = "> Hello";
    const { doc, head } = applyEnter(source, source.length);
    expect(doc).toBe("> Hello\n> ");
    expect(head).toBe("> Hello\n> ".length);
  });

  it("exits blockquote on Return at empty > line", () => {
    const source = "> Hello\n> ";
    const { doc, head } = applyEnter(source, source.length);
    expect(doc).toBe("> Hello\n");
    expect(head).toBe("> Hello\n".length);
  });

  it("does not insert > when Return on a plain line after a quote (no lazy continuation)", () => {
    const source = "> quoted\nplain paragraph";
    const { doc } = applyEnter(source, source.length);
    expect(doc).toBe("> quoted\nplain paragraph\n");
    expect(doc.match(/^> /gm)?.length).toBe(1);
  });

  it("continues bullet list with the same marker", () => {
    const source = "- one";
    const { doc, head } = applyEnter(source, source.length);
    expect(doc).toBe("- one\n- ");
    expect(head).toBe("- one\n- ".length);
  });

  it("exits list on Return at empty list line", () => {
    const source = "- one\n- ";
    const { doc } = applyEnter(source, source.length);
    expect(doc).toBe("- one\n");
  });

  it("starts a plain paragraph after a heading line", () => {
    const source = "# Title";
    const { doc, head } = applyEnter(source, source.length);
    expect(doc).toBe("# Title\n");
    expect(head).toBe("# Title\n".length);
  });

  it("clears an empty heading marker line", () => {
    const source = "# ";
    const { doc } = applyEnter(source, source.length);
    expect(doc).toBe("");
  });
});
