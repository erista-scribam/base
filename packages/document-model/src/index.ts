export { PROSA_SCHEMA_VERSION, type ProsaSchemaVersion } from "./prosa/version";
export type {
  ProsaBlock,
  ProsaDocument,
  ProsaHeadingBlock,
  ProsaInlineMark,
  ProsaInlineNode,
  ProsaParagraphBlock,
  ProsaBlockquoteBlock,
  ProsaSceneBreakBlock,
} from "./prosa/types";
export { prosaDocumentSchema, prosaBlockSchema } from "./prosa/schema";
export { validateProsaDocument, parseProsaDocument } from "./prosa/validate";
export { serializeProsaDocument, deserializeProsaDocument } from "./prosa/serialize";
export { createEmptyProsaDocument } from "./prosa/factory";
export type { DocumentMigration } from "./migration";
