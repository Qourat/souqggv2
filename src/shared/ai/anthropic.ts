import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/shared/env";

import type {
  LlmAdapter,
  LlmCompletionInput,
  LlmCompletionResult,
  LlmMessage,
} from "./types";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const DEFAULT_MODEL = "claude-3-5-haiku-latest";

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-3-5-haiku-latest": { input: 0.8, output: 4.0 },
  "claude-3-5-sonnet-latest": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-opus-4-5": { input: 15.0, output: 75.0 },
};

function priceUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  return (
    (p.input * inputTokens) / 1_000_000 + (p.output * outputTokens) / 1_000_000
  );
}

function toAnthropicMessages(
  messages: LlmMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
}

export const anthropicLlm: LlmAdapter = {
  id: "anthropic",
  defaultModel: DEFAULT_MODEL,
  async complete(input: LlmCompletionInput): Promise<LlmCompletionResult> {
    const model = input.model ?? DEFAULT_MODEL;
    const system = input.json
      ? `${input.system ?? ""}\n\nReply with VALID JSON only — no prose, no code fences, no commentary.`.trim()
      : input.system;

    const res = await getClient().messages.create({
      model,
      system,
      max_tokens: input.maxTokens ?? 1500,
      temperature: input.temperature ?? 0.4,
      messages: toAnthropicMessages(input.messages),
    });

    const text = res.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const inputTokens = res.usage?.input_tokens ?? 0;
    const outputTokens = res.usage?.output_tokens ?? 0;

    return {
      text,
      usage: {
        inputTokens,
        outputTokens,
        costUsd: priceUsd(model, inputTokens, outputTokens),
      },
      model,
      provider: "anthropic",
    };
  },
};
