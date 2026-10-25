import CodeBlock from "@tiptap/extension-code-block";

export const ProsaCodeBlock = CodeBlock.extend({
  renderHTML({ HTMLAttributes }) {
    return ["pre", { class: "ms-code-block", ...HTMLAttributes }, ["code", {}, 0]];
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      "Shift-Enter": ({ editor }) => {
        if (!editor.isActive(this.name)) {
          return false;
        }
        const { from, to } = editor.state.selection;
        return editor.chain().insertContentAt({ from, to }, "\n").run();
      },
    };
  },
});
