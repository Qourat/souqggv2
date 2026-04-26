import "server-only";

import { AppError, ok, tryAsync, type Result } from "@/core";
import { logger } from "@/core/logger";
import { hasSupabase } from "@/shared/db/has-supabase";

import { auditRepository, type ListAuditOptions } from "./audit.repository";
import type { AuditEntry, AuditWriteInput } from "./audit.types";

const log = logger("audit.service");

/**
 * Audit log service.
 *
 * `log()` is best-effort: a failure to write an audit row must NEVER fail
 * the calling business action. We log the error and move on. The DB and
 * the application are still in a consistent state — only the trail is
 * incomplete, and the calling site is recorded in app logs anyway.
 */
export const auditService = {
  async log(input: AuditWriteInput): Promise<void> {
    if (!hasSupabase()) return;
    const r = await tryAsync(
      () => auditRepository.log(input),
      AppError.fromUnknown,
    );
    if (!r.ok) {
      log.error("audit write failed", {
        action: input.action,
        entity: input.entityType,
        message: r.error.message,
      });
    }
  },

  async list(
    options: ListAuditOptions = {},
  ): Promise<Result<{ rows: AuditEntry[]; total: number }>> {
    if (!hasSupabase()) return ok({ rows: [], total: 0 });
    const r = await tryAsync(
      () => auditRepository.list(options),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(r.value);
  },
};
