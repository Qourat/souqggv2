export interface AuditEntry {
  id: number;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  diff: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuditWriteInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  diff?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}
