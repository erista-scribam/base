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

/** Persists Prosa block ids on TipTap nodes for Classic ↔ model round-trips. */
export const ScriboBlockId = Extension.create({
  name: "scriboBlockId",

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_NODE_TYPES],
        attributes: {
          scriboBlockId: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-scribo-block-id"),
            renderHTML: (attributes) => {
              if (!attributes.scriboBlockId) {
                return {};
              }
              return { "data-scribo-block-id": attributes.scriboBlockId };
            },
          },
        },
      },
    ];
  },
});
