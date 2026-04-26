import "server-only";

import { auditService } from "./audit.service";
import type { ListAuditOptions } from "./audit.repository";
import type { AuditEntry } from "./audit.types";

export const auditController = {
  async list(
    options: ListAuditOptions = {},
  ): Promise<{ rows: AuditEntry[]; total: number }> {
    const r = await auditService.list(options);
    if (!r.ok) throw r.error;
    return r.value;
  },
};
