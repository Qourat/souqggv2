"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";

import { aiService } from "./ai.service";
import type { AiAgentId, AiRunOutput } from "./ai.types";

export interface AiRunActionResult {
  ok: boolean;
  message?: string;
  output?: AiRunOutput;
  errors?: Record<string, string[]>;
}

export async function runAgentAction(
  agent: AiAgentId,
  input: Record<string, unknown>,
  model?: string,
): Promise<AiRunActionResult> {
  const user = await requireAdmin();
  const result = await aiService.run({ agent, input, model }, { id: user.id });
  if (!result.ok) {
    return {
      ok: false,
      message: result.error.message,
      errors:
        (result.error.details as Record<string, string[]> | undefined) ??
        undefined,
    };
  }
  revalidatePath("/admin/ai-tools", "page");
  return { ok: true, output: result.value };
}
