import type { CSSProperties, MouseEvent } from "react";
import {
  buildMarkdownOutline,
  outlineEntryContainsLine,
  type MarkdownOutlineEntry,
} from "../features/markdown/markdown-sections";

export interface MarkdownSectionOutlineProps {
  markdown: string;
  activeLine: number | null;
  onGoToLine: (line: number) => void;
}

function entryKey(entry: MarkdownOutlineEntry): string {
  return `${entry.type}-${entry.line}`;
}

/** Keep focus in the editor; avoid button focus stealing scroll on mouse click. */
function outlineNavHandlers(onGoToLine: (line: number) => void, line: number) {
  return {
    onMouseDown: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    },
    onClick: () => {
      onGoToLine(line);
    },
  };
}

export function MarkdownSectionOutline({
  markdown,
  activeLine,
  onGoToLine,
}: MarkdownSectionOutlineProps) {
  const entries = buildMarkdownOutline(markdown);

  if (entries.length === 0) {
    return <p className="markdown-outline-empty">No sections yet — add headings or scene breaks.</p>;
  }

  return (
    <nav className="markdown-outline" aria-label="Document sections">
      <ul className="markdown-outline-list">
        {entries.map((entry) => {
          if (entry.type === "scene_break") {
            return (
              <li key={entryKey(entry)} className="markdown-outline-item markdown-outline-break">
                <button
                  type="button"
                  className="markdown-outline-break-btn"
                  data-active={activeLine === entry.line ? "true" : undefined}
                  {...outlineNavHandlers(onGoToLine, entry.line)}
                >
                  Scene break
                </button>
              </li>
            );
          }

          const active = activeLine != null && outlineEntryContainsLine(entry, activeLine);
          const goTo = entry.startLine;
          if (entry.type === "heading") {
            return (
              <li
                key={entryKey(entry)}
                className="markdown-outline-item markdown-outline-heading"
                style={{ "--outline-level": entry.level } as CSSProperties}
              >
                <button
                  type="button"
                  className="markdown-outline-link"
                  data-active={active ? "true" : undefined}
                  {...outlineNavHandlers(onGoToLine, goTo)}
                >
                  {entry.title}
                </button>
              </li>
            );
          }

          return (
            <li key={entryKey(entry)} className="markdown-outline-item markdown-outline-passage">
              <button
                type="button"
                className="markdown-outline-link markdown-outline-passage-link"
                data-active={active ? "true" : undefined}
                {...outlineNavHandlers(onGoToLine, goTo)}
              >
                {entry.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
