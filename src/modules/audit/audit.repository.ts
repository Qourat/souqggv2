import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";

import type { AuditEntry, AuditWriteInput } from "./audit.types";

interface RawAuditEntry {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

function toEntry(r: RawAuditEntry): AuditEntry {
  return {
    id: r.id,
    actorId: r.actor_id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    diff: r.diff,
    ip: r.ip,
    userAgent: r.user_agent,
    createdAt: new Date(r.created_at),
  };
}

export interface ListAuditOptions {
  entityType?: string;
  action?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}

export const auditRepository = {
  async log(input: AuditWriteInput): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      diff: input.diff ?? {},
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
    });
    if (error) throw error;
  },

  async list(
    options: ListAuditOptions = {},
  ): Promise<{ rows: AuditEntry[]; total: number }> {
    const supabase = createSupabaseAdminClient();
    let q = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (options.entityType) q = q.eq("entity_type", options.entityType);
    if (options.action) q = q.eq("action", options.action);
    if (options.actorId) q = q.eq("actor_id", options.actorId);
    if (options.limit !== undefined) {
      const offset = options.offset ?? 0;
      q = q.range(offset, offset + options.limit - 1);
    }
    const { data, error, count } = await q;
    if (error) throw error;
    return {
      rows: ((data ?? []) as unknown as RawAuditEntry[]).map(toEntry),
      total: count ?? 0,
    };
  },
};
