/**
 * AI module — Sprint 6.
 *
 * Internal admin tools only. Each agent gets its own descriptor +
 * Zod input/output schema + prompt builder under ./agents and
 * registers itself in agents/index.ts. The service drives every
 * agent through the same pipeline: validate → rate-limit → log →
 * call LLM adapter → parse → persist.
 *
 * Buyer-facing surfaces NEVER touch this module.
 */

export { aiController } from "./ai.controller";
export { aiService, runInputSchema } from "./ai.service";
export { runAgentAction } from "./ai.actions";
export { listAgents, getAgent, AGENT_IDS } from "./agents";
export type {
  AiAgentDescriptor,
  AiAgentId,
  AiAgentInputField,
  AiJob,
  AiJobStatus,
  AiRunInput,
  AiRunOutput,
} from "./ai.types";
