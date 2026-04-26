export type LlmRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmCompletionInput {
  model?: string;
  system?: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export interface LlmCompletionUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface LlmCompletionResult {
  text: string;
  usage: LlmCompletionUsage;
  model: string;
  provider: "openai" | "anthropic" | "noop";
}

export interface LlmAdapter {
  id: "openai" | "anthropic" | "noop";
  defaultModel: string;
  complete(input: LlmCompletionInput): Promise<LlmCompletionResult>;
}
