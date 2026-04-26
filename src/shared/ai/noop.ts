import "server-only";

import type {
  LlmAdapter,
  LlmCompletionInput,
  LlmCompletionResult,
} from "./types";

/**
 * No-op LLM used when no API key is configured. Returns a
 * deterministic placeholder so the admin UI is still wired
 * end-to-end in dev / preview deploys without spending money.
 */
export const noopLlm: LlmAdapter = {
  id: "noop",
  defaultModel: "noop-1",
  async complete(input: LlmCompletionInput): Promise<LlmCompletionResult> {
    const last = input.messages[input.messages.length - 1]?.content ?? "";
    const json = input.json
      ? JSON.stringify({
          ok: true,
          note: "noop adapter — set OPENAI_API_KEY or ANTHROPIC_API_KEY to enable real generations.",
          echo: last.slice(0, 200),
        })
      : `# noop adapter\n\nSet OPENAI_API_KEY or ANTHROPIC_API_KEY to enable real generations.\n\n> ${last.slice(0, 200)}`;
    return {
      text: json,
      usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
      model: "noop-1",
      provider: "noop",
    };
  },
};
