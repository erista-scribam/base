import { z } from "zod";
import { isDocumentId } from "@scribo/core";
import { PROSA_SCHEMA_VERSION } from "./version";

const inlineMarkSchema = z.enum(["bold", "italic", "underline", "link"]);

export const prosaInlineNodeSchema = z
  .object({
    type: z.literal("text"),
    id: z.string().min(1),
    text: z.string(),
    marks: z.array(inlineMarkSchema).optional(),
    href: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((node, ctx) => {
    const hasLink = node.marks?.includes("link") ?? false;
    if (hasLink && !node.href) {
      ctx.addIssue({
        code: "custom",
        message: "Link marks require an href",
        path: ["href"],
      });
    }
    if (!hasLink && node.href) {
      ctx.addIssue({
        code: "custom",
        message: "href is only valid with the link mark",
        path: ["href"],
      });
    }
  });

const inlineContentSchema = z.array(prosaInlineNodeSchema);

export const prosaBlockSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("heading"),
      id: z.string().min(1),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      content: inlineContentSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("paragraph"),
      id: z.string().min(1),
      content: inlineContentSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("blockquote"),
      id: z.string().min(1),
      content: inlineContentSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("scene_break"),
      id: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("list"),
      id: z.string().min(1),
      ordered: z.boolean(),
      items: z
        .array(
          z
            .object({
              id: z.string().min(1),
              content: inlineContentSchema,
            })
            .strict(),
        )
        .min(1),
    })
    .strict(),
]);

export const prosaDocumentSchema = z
  .object({
    schemaVersion: z.literal(PROSA_SCHEMA_VERSION),
    id: z.string().refine(isDocumentId, "Invalid document id"),
    title: z.string(),
    blocks: z.array(prosaBlockSchema),
  })
  .strict();
