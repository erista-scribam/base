export type ScriboErrorCode =
  | "validation_failed"
  | "schema_version_unsupported"
  | "serialization_failed"
  | "deserialization_failed";

export class ScriboError extends Error {
  readonly code: ScriboErrorCode;

  constructor(code: ScriboErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScriboError";
    this.code = code;
  }
}

export class ValidationError extends ScriboError {
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super("validation_failed", message);
    this.name = "ValidationError";
    this.details = details;
  }
}
