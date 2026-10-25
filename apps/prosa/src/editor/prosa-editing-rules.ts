import { Extension } from "@tiptap/core";

/** Match markdown: blank lines are not stored as empty paragraph blocks. */
export const ProsaEditingRules = Extension.create({
  name: "prosaEditingRules",
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.state.selection.empty) {
          return false;
        }
        if (editor.isActive("codeBlock")) {
          return false;
        }
        const { $from } = editor.state.selection;
        const parent = $from.parent;
        if (parent.type.name !== "paragraph" || parent.content.size > 0) {
          return false;
        }
        const index = $from.index($from.depth - 1);
        if (index <= 0) {
          return true;
        }
        return editor.chain().joinBackward().run();
      },
    };
  },
});
