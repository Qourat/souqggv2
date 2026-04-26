import type { AiJobRow } from "@/shared/db/schema";

export type AiJob = AiJobRow;

export type AiJobStatus = "queued" | "running" | "succeeded" | "failed";

/**
 * Identifiers for every internal agent. Add new entries here AND in
 * the registry in `agents/index.ts`. Keeping the union narrow gives
 * us autocomplete in actions, the API route, and the admin UI.
 */
export type AiAgentId =
  | "listing"
  | "seo"
  | "marketing"
  | "qa"
  | "compliance";

export interface AiAgentDescriptor {
  id: AiAgentId;
  /** mono label, lowercase, used in UI cards. */
  label: string;
  description: string;
  /** Maximum input tokens we send (rough budget). */
  budgetTokens: number;
  /** Hint for the run form on what shape of input to collect. */
  inputShape: AiAgentInputField[];
}

export interface AiAgentInputField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  helperText?: string;
}

export interface AiRunInput {
  agent: AiAgentId;
  input: Record<string, unknown>;
  /** Optional model override for power users. */
  model?: string;
}

export interface AiRunOutput {
  jobId: string;
  agent: AiAgentId;
  text: string;
  parsed?: unknown;
  costUsd: number;
  durationMs: number;
  model: string;
  provider: "openai" | "anthropic" | "noop";
}
