import { Extension } from "@tiptap/core";

const BLOCK_NODE_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "sceneBreak",
  "bulletList",
  "orderedList",
  "taskList",
] as const;

/** Persists Prosa block ids on TipTap nodes for Proper ↔ model round-trips. */
export const ScribamBlockId = Extension.create({
  name: "scribamBlockId",

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_NODE_TYPES],
        attributes: {
          scribamBlockId: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute("data-scribam-block-id") ??
              element.getAttribute("data-scribo-block-id"),
            renderHTML: (attributes) => {
              if (!attributes.scribamBlockId) {
                return {};
              }
              return { "data-scribam-block-id": attributes.scribamBlockId };
            },
          },
        },
      },
    ];
  },
});
