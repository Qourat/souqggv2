/**
 * Audit module — Sprint 7 polish.
 *
 * Persists admin-visible action history into the `audit_log` table.
 * Writes are best-effort (failure NEVER rolls back the calling action);
 * reads power /admin/audit-log.
 */

export { auditController } from "./audit.controller";
export { auditService } from "./audit.service";
export type { AuditEntry, AuditWriteInput } from "./audit.types";
export type { ListAuditOptions } from "./audit.repository";
