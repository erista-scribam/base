import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";

/**
 * iA Writer: Shift+Enter inserts a Markdown hard line break (two spaces + newline).
 */
export const prosaMarkdownShiftEnterKeymap = Prec.high(
  keymap.of([
    {
      key: "Shift-Enter",
      run: (view) => {
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: "  \n" },
          selection: { anchor: from + 3 },
        });
        return true;
      },
    },
  ]),
);
