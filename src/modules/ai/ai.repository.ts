import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";

import type { AiJob, AiAgentId, AiJobStatus } from "./ai.types";

interface RawAiJob {
  id: string;
  agent: string;
  status: AiJobStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  cost_usd: string | number | null;
  duration_ms: number | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

function toJob(r: RawAiJob): AiJob {
  return {
    id: r.id,
    agent: r.agent,
    status: r.status,
    input: r.input,
    output: r.output,
    error: r.error,
    costUsd:
      typeof r.cost_usd === "string"
        ? r.cost_usd
        : r.cost_usd !== null
          ? String(r.cost_usd)
          : "0",
    durationMs: r.duration_ms,
    createdBy: r.created_by,
    createdAt: new Date(r.created_at),
    completedAt: r.completed_at ? new Date(r.completed_at) : null,
  } as AiJob;
}

export const aiJobsRepository = {
  async create(input: {
    agent: AiAgentId;
    input: Record<string, unknown>;
    createdBy: string | null;
  }): Promise<AiJob> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_jobs")
      .insert({
        agent: input.agent,
        status: "running",
        input: input.input,
        created_by: input.createdBy,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toJob(data as unknown as RawAiJob);
  },

  async markSucceeded(input: {
    id: string;
    output: Record<string, unknown>;
    costUsd: number;
    durationMs: number;
  }): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        output: input.output,
        cost_usd: input.costUsd,
        duration_ms: input.durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) throw error;
  },

  async markFailed(input: {
    id: string;
    error: string;
    durationMs: number;
  }): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error: input.error,
        duration_ms: input.durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) throw error;
  },

  async listRecent(options: {
    agent?: AiAgentId;
    limit?: number;
  } = {}): Promise<AiJob[]> {
    const supabase = createSupabaseAdminClient();
    let q = supabase
      .from("ai_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 20);
    if (options.agent) q = q.eq("agent", options.agent);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as unknown as RawAiJob[]).map(toJob);
  },

  async findById(id: string): Promise<AiJob | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_jobs")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toJob(data as unknown as RawAiJob) : null;
  },
};
