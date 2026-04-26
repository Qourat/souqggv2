/**
 * Result<T, E> — every service method returns one of these instead of
 * throwing on expected failures. Forces the caller (controller/UI) to handle
 * both branches at the type level. Throw only for genuinely exceptional
 * conditions (programmer error, infra outage).
 */

import type { AppError } from "./errors";

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return !r.ok;
}

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error;
}

export function map<T, U, E>(
  r: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export async function tryAsync<T>(
  fn: () => Promise<T>,
  onError: (e: unknown) => AppError,
): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(onError(e));
  }
}
