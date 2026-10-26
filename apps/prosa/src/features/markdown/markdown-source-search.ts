import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  search,
  searchKeymap,
  SearchQuery,
  setSearchQuery,
} from "@codemirror/search";
import { EditorView, keymap, type Panel, type ViewUpdate } from "@codemirror/view";
import { Prec } from "@codemirror/state";

function createProsaSearchPanel(view: EditorView): Panel {
  let query = getSearchQuery(view.state);
  const readOnly = view.state.readOnly;

  const searchField = document.createElement("input");
  searchField.type = "search";
  searchField.className = "prosa-search-input";
  searchField.setAttribute("main-field", "true");
  searchField.setAttribute("aria-label", "Find in document");
  searchField.placeholder = "Find in manuscript…";
  searchField.value = query.search;

  const replaceField = document.createElement("input");
  replaceField.type = "text";
  replaceField.className = "prosa-search-input";
  replaceField.setAttribute("aria-label", "Replace with");
  replaceField.placeholder = "Replace with…";
  replaceField.value = query.replace;

  const caseToggle = document.createElement("button");
  caseToggle.type = "button";
  caseToggle.className = "prosa-search-toggle";
  caseToggle.setAttribute("aria-pressed", query.caseSensitive ? "true" : "false");
  caseToggle.title = "Match case";
  caseToggle.textContent = "Aa";

  const status = document.createElement("span");
  status.className = "prosa-search-status";
  status.setAttribute("aria-live", "polite");

  const commit = () => {
    const next = new SearchQuery({
      search: searchField.value,
      replace: replaceField.value,
      caseSensitive: caseToggle.getAttribute("aria-pressed") === "true",
    });
    if (!next.eq(query)) {
      query = next;
      view.dispatch({ effects: setSearchQuery.of(next) });
    }
  };

  searchField.addEventListener("input", commit);
  searchField.addEventListener("change", commit);
  replaceField.addEventListener("input", commit);
  replaceField.addEventListener("change", commit);
  caseToggle.addEventListener("click", () => {
    const on = caseToggle.getAttribute("aria-pressed") !== "true";
    caseToggle.setAttribute("aria-pressed", on ? "true" : "false");
    commit();
  });

  const mkBtn = (label: string, action: () => void, options?: { title?: string }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "prosa-search-btn";
    btn.textContent = label;
    if (options?.title) {
      btn.title = options.title;
    }
    btn.addEventListener("click", () => action());
    return btn;
  };

  const mkLabel = (text: string) => {
    const label = document.createElement("span");
    label.className = "prosa-search-label";
    label.textContent = text;
    return label;
  };

  const closeBtn = mkBtn("×", () => closeSearchPanel(view));
  closeBtn.className = "prosa-search-btn prosa-search-close";
  closeBtn.setAttribute("aria-label", "Close find");

  const findRow = document.createElement("div");
  findRow.className = "prosa-search-row";
  findRow.append(
    mkLabel("Find"),
    searchField,
    mkBtn("↓", () => findNext(view), { title: "Next match" }),
    mkBtn("↑", () => findPrevious(view), { title: "Previous match" }),
    caseToggle,
    status,
    closeBtn,
  );

  const dom = document.createElement("div");
  dom.className = "prosa-search-panel";
  dom.setAttribute("role", "search");
  dom.append(findRow);

  if (!readOnly) {
    const replaceRow = document.createElement("div");
    replaceRow.className = "prosa-search-row prosa-search-replace-row";
    replaceRow.append(
      mkLabel("Replace"),
      replaceField,
      mkBtn("Replace", () => replaceNext(view), { title: "Replace current match" }),
      mkBtn("Replace all", () => replaceAll(view), { title: "Replace all matches" }),
    );
    dom.append(replaceRow);
  }

  dom.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearchPanel(view);
      return;
    }
    if (event.key === "Enter" && event.target === searchField) {
      event.preventDefault();
      if (event.shiftKey) {
        findPrevious(view);
      } else {
        findNext(view);
      }
    }
    if (event.key === "Enter" && event.target === replaceField) {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        replaceAll(view);
      } else {
        replaceNext(view);
      }
    }
  });

  return {
    dom,
    top: true,
    mount() {
      searchField.focus();
      searchField.select();
    },
    update(update: ViewUpdate) {
      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (effect.is(setSearchQuery)) {
            const spec = effect.value;
            if (!spec.eq(query)) {
              query = spec;
              searchField.value = spec.search;
              replaceField.value = spec.replace;
              caseToggle.setAttribute("aria-pressed", spec.caseSensitive ? "true" : "false");
            }
          }
        }
      }
    },
  };
}

const prosaSearchTheme = EditorView.theme({
  ".cm-panels": {
    backgroundColor: "var(--scribam-ui-surface)",
    color: "var(--scribam-ui-text)",
    borderBottom: "1px solid var(--scribam-ui-border)",
  },
  ".cm-panels-top": {
    borderBottom: "1px solid var(--scribam-ui-border)",
    borderTop: "none",
  },
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in srgb, var(--scribam-ui-accent) 35%, transparent)",
    outline: "1px solid color-mix(in srgb, var(--scribam-ui-accent) 55%, transparent)",
  },
  ".cm-searchMatch-selected": {
    backgroundColor: "color-mix(in srgb, var(--scribam-ui-accent) 50%, transparent)",
  },
});

export const prosaMarkdownSearchExtension = [
  Prec.high(keymap.of(searchKeymap)),
  search({ createPanel: createProsaSearchPanel }),
  prosaSearchTheme,
];
