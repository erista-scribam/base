import type { JSX, ReactNode } from "react";
import type { ProsaBlock, ProsaDocument, ProsaInlineNode } from "@scribo/document-model";

function renderInline(nodes: ProsaInlineNode[]) {
  return nodes.map((node) => {
    const marks = node.marks ?? [];
    let element: ReactNode = node.text;
    if (marks.includes("bold")) {
      element = <strong>{element}</strong>;
    }
    if (marks.includes("italic")) {
      element = <em>{element}</em>;
    }
    if (marks.includes("underline")) {
      element = <u>{element}</u>;
    }
    if (marks.includes("link") && node.href) {
      element = (
        <a href={node.href} onClick={(event) => event.preventDefault()}>
          {element}
        </a>
      );
    }
    return <span key={node.id}>{element}</span>;
  });
}

function renderBlock(block: ProsaBlock) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
      return <Tag key={block.id}>{renderInline(block.content)}</Tag>;
    }
    case "paragraph":
      return <p key={block.id}>{renderInline(block.content)}</p>;
    case "blockquote":
      return <blockquote key={block.id}>{renderInline(block.content)}</blockquote>;
    case "scene_break":
      return <hr key={block.id} data-scene-break="true" />;
    default:
      return null;
  }
}

export function ManuscriptPreview({ document }: { document: ProsaDocument }) {
  return (
    <article className="manuscript-root manuscript-preview">
      {document.blocks.map(renderBlock)}
    </article>
  );
}
