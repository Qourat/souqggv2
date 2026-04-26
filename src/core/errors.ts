/**
 * Typed application error. Has a stable `code` so the UI can map it to a
 * translated message, an HTTP `status` for route handlers, and an optional
 * `details` blob (e.g. zod issues) for forms.
 */

export type AppErrorCode =
  | "UNKNOWN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_FAILED"
  | "STORAGE_FAILED"
  | "DEPENDENCY_DOWN";

export interface AppErrorJSON {
  code: AppErrorCode;
  message: string;
  status: number;
  details?: unknown;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    status = 400,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toJSON(): AppErrorJSON {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }

  static notFound(entity = "resource") {
    return new AppError("NOT_FOUND", `${entity} not found`, 404);
  }

  static validation(message = "Invalid input", details?: unknown) {
    return new AppError("VALIDATION", message, 422, details);
  }

  static unauthorized(message = "Sign in required") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static conflict(message = "Conflict") {
    return new AppError("CONFLICT", message, 409);
  }

  static dependencyDown(message = "Upstream dependency unavailable") {
    return new AppError("DEPENDENCY_DOWN", message, 503);
  }

  static tooManyRequests(message = "Too many requests") {
    return new AppError("RATE_LIMITED", message, 429);
  }

  static fromUnknown(e: unknown): AppError {
    if (e instanceof AppError) return e;
    if (e instanceof Error) return new AppError("UNKNOWN", e.message, 500);
    return new AppError("UNKNOWN", String(e), 500);
  }
}
