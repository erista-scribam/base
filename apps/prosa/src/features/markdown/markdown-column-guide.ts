import { Facet, type Extension } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { MARKDOWN_MARKER_COLUMNS } from "./codemirror-markdown-layout";

/** Body prose limit (monospace columns after the marker field). `null` = full width. */
export const markdownBodyColumnFacet = Facet.define<number | null, number | null>({
  combine: (values) => values[0] ?? null,
});

/** Bumped when editor zoom changes so layout remeasures after font-size updates. */
export const markdownEditorZoomFacet = Facet.define<number, number>({
  combine: (values) => values[0] ?? 1,
});

export function markdownGuideExtension(
  bodyColumnLimit: number | null,
  editorZoom: number,
): Extension {
  return [
    markdownBodyColumnFacet.of(bodyColumnLimit),
    markdownEditorZoomFacet.of(editorZoom),
    markdownColumnGuidePlugin,
  ];
}

function markdownSourceStack(view: EditorView): HTMLElement | null {
  return view.dom.closest(".markdown-source-stack");
}

export function applyMarkdownColumnLayout(view: EditorView): void {
  const stack = markdownSourceStack(view);
  if (!stack) {
    return;
  }

  const charWidth = view.defaultCharacterWidth;
  if (charWidth <= 0) {
    return;
  }

  const bodyColumns = view.state.facet(markdownBodyColumnFacet);
  const padX = Number.parseFloat(getComputedStyle(view.contentDOM).paddingLeft) || 0;
  const markerWidth = MARKDOWN_MARKER_COLUMNS * charWidth;

  stack.style.setProperty("--md-char-width", `${charWidth}px`);
  stack.style.setProperty("--md-marker-width", `${markerWidth}px`);

  if (bodyColumns == null) {
    stack.dataset.ruler = "full";
    stack.style.removeProperty("--md-line-width");
    stack.style.removeProperty("--md-content-max-width");
    return;
  }

  const lineWidth = markerWidth + bodyColumns * charWidth;
  stack.dataset.ruler = "columns";
  stack.style.setProperty("--md-line-width", `${lineWidth}px`);
  stack.style.setProperty("--md-content-max-width", `${lineWidth + padX * 2}px`);
}

/** Remeasure after font metrics change (zoom, theme). */
export function relayoutMarkdownColumnGuide(view: EditorView): void {
  view.requestMeasure();
  requestAnimationFrame(() => {
    view.requestMeasure();
    requestAnimationFrame(() => applyMarkdownColumnLayout(view));
  });
}

class MarkdownColumnGuidePlugin {
  private resizeObserver: ResizeObserver | null = null;
  private onWindowResize = () => this.schedule();

  constructor(private view: EditorView) {
    this.schedule();
    window.addEventListener("resize", this.onWindowResize);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.schedule());
      this.resizeObserver.observe(this.view.scrollDOM);
    }
  }

  update(update: ViewUpdate) {
    const colsChanged =
      update.startState.facet(markdownBodyColumnFacet) !==
      update.state.facet(markdownBodyColumnFacet);
    const zoomChanged =
      update.startState.facet(markdownEditorZoomFacet) !==
      update.state.facet(markdownEditorZoomFacet);

    if (
      update.docChanged ||
      update.geometryChanged ||
      update.viewportChanged ||
      colsChanged ||
      zoomChanged
    ) {
      if (zoomChanged) {
        relayoutMarkdownColumnGuide(this.view);
        return;
      }
      this.schedule();
    }
  }

  destroy() {
    window.removeEventListener("resize", this.onWindowResize);
    this.resizeObserver?.disconnect();
  }

  private schedule() {
    requestAnimationFrame(() => applyMarkdownColumnLayout(this.view));
  }
}

const markdownColumnGuidePlugin = ViewPlugin.fromClass(MarkdownColumnGuidePlugin);
