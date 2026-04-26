import { env } from "@/shared/env";

import { anthropicLlm } from "./anthropic";
import { noopLlm } from "./noop";
import { openAiLlm } from "./openai";

import type { LlmAdapter } from "./types";

/**
 * Active LLM adapter for internal admin agents. Resolution order:
 *   1. OPENAI_API_KEY  → OpenAI (gpt-4o-mini default — cheap & fast)
 *   2. ANTHROPIC_API_KEY → Anthropic Claude Haiku
 *   3. neither set → noop (echoes input, zero spend)
 *
 * Buyer-facing surfaces NEVER call this. AI is admin-internal only.
 */
export const llm: LlmAdapter = env.OPENAI_API_KEY
  ? openAiLlm
  : env.ANTHROPIC_API_KEY
    ? anthropicLlm
    : noopLlm;

export function isLlmConfigured(): boolean {
  return llm.id !== "noop";
}

export type {
  LlmAdapter,
  LlmCompletionInput,
  LlmCompletionResult,
  LlmCompletionUsage,
  LlmMessage,
  LlmRole,
} from "./types";
