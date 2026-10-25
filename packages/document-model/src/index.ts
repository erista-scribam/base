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
  ProsaListBlock,
  ProsaListItem,
} from "./prosa/types";
export { prosaDocumentSchema, prosaBlockSchema } from "./prosa/schema";
export {
  validateProsaDocument,
  parseProsaDocument,
  tryValidateProsaDocument,
} from "./prosa/validate";
export { repairProsaDocumentInput } from "./prosa/repair";
export { serializeProsaDocument, deserializeProsaDocument } from "./prosa/serialize";
export { createEmptyProsaDocument } from "./prosa/factory";
export type { DocumentMigration } from "./migration";
