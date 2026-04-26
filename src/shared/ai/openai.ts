import "server-only";

import OpenAI from "openai";

import { env } from "@/shared/env";

import type {
  LlmAdapter,
  LlmCompletionInput,
  LlmCompletionResult,
  LlmMessage,
} from "./types";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  _client = new OpenAI({ apiKey: key });
  return _client;
}

const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Per-1M-tokens USD pricing for the models we use. Kept here on
 * purpose so cost accounting stays grep-able. Update when OpenAI
 * publishes new prices — we'd rather over-estimate than miss spend.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
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

function toOpenAiMessages(
  system: string | undefined,
  messages: LlmMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (system) out.push({ role: "system", content: system });
  for (const m of messages) {
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

export const openAiLlm: LlmAdapter = {
  id: "openai",
  defaultModel: DEFAULT_MODEL,
  async complete(input: LlmCompletionInput): Promise<LlmCompletionResult> {
    const model = input.model ?? DEFAULT_MODEL;
    const res = await getClient().chat.completions.create({
      model,
      messages: toOpenAiMessages(input.system, input.messages),
      temperature: input.temperature ?? 0.4,
      max_tokens: input.maxTokens ?? 1500,
      response_format: input.json ? { type: "json_object" } : undefined,
    });

    const text = res.choices[0]?.message?.content ?? "";
    const inputTokens = res.usage?.prompt_tokens ?? 0;
    const outputTokens = res.usage?.completion_tokens ?? 0;

    return {
      text,
      usage: {
        inputTokens,
        outputTokens,
        costUsd: priceUsd(model, inputTokens, outputTokens),
      },
      model,
      provider: "openai",
    };
  },
};
