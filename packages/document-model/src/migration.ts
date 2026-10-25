import type { ProsaDocument } from "./prosa/types";

export interface DocumentMigration {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(document: unknown): ProsaDocument;
}
