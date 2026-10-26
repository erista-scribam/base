export type ScribamErrorCode =
  | "validation_failed"
  | "schema_version_unsupported"
  | "serialization_failed"
  | "deserialization_failed";

export class ScribamError extends Error {
  readonly code: ScribamErrorCode;

  constructor(code: ScribamErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScribamError";
    this.code = code;
  }
}

export class ValidationError extends ScribamError {
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super("validation_failed", message);
    this.name = "ValidationError";
    this.details = details;
  }
}
