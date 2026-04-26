import "server-only";

import { z } from "zod";

import { AppError, ok, err, tryAsync, type Result } from "@/core";
import { logger } from "@/core/logger";
import { hasSupabase } from "@/shared/db/has-supabase";
import { llm, isLlmConfigured } from "@/shared/ai";

import { aiJobsRepository } from "./ai.repository";
import { checkRate } from "./ai.rate-limit";
import { getAgent, AGENT_IDS } from "./agents";
import type { AiAgentId, AiJob, AiRunOutput } from "./ai.types";

const log = logger("ai.service");

/**
 * AI service.
 *
 * Drives every internal agent through the same pipeline:
 *   1. Validate input via the agent's Zod schema.
 *   2. Rate-limit by (userId, agent).
 *   3. Persist a `running` row in `ai_jobs`.
 *   4. Build the prompt and call the active llm adapter.
 *   5. Parse the model output (JSON if the agent expects it).
 *   6. Persist `succeeded` (with cost + duration + parsed output)
 *      or `failed` (with the error message + duration).
 *   7. Return a typed AiRunOutput to the caller.
 *
 * Failures NEVER leak raw provider errors to the UI — we map them to
 * AppError so callers see consistent .message + .code.
 */

export const runInputSchema = z.object({
  agent: z.enum(AGENT_IDS as [AiAgentId, ...AiAgentId[]]),
  input: z.record(z.string(), z.unknown()),
  model: z.string().optional(),
});

export const aiService = {
  isEnabled(): boolean {
    return isLlmConfigured();
  },

  async listRecent(
    agent?: AiAgentId,
    limit = 20,
  ): Promise<Result<AiJob[]>> {
    if (!hasSupabase()) return ok([]);
    return tryAsync(
      () => aiJobsRepository.listRecent({ agent, limit }),
      AppError.fromUnknown,
    );
  },

  async getById(id: string): Promise<Result<AiJob | null>> {
    if (!id) return err(AppError.validation("id required"));
    if (!hasSupabase()) return ok(null);
    return tryAsync(() => aiJobsRepository.findById(id), AppError.fromUnknown);
  },

  async run(
    rawInput: unknown,
    actor: { id: string },
  ): Promise<Result<AiRunOutput>> {
    const parsed = runInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid input", parsed.error.format()));
    }
    const { agent: agentId, input, model } = parsed.data;
    const agent = getAgent(agentId);
    if (!agent) return err(AppError.notFound(`agent: ${agentId}`));

    const inputCheck = agent.inputSchema.safeParse(input);
    if (!inputCheck.success) {
      return err(
        AppError.validation("Invalid agent input", inputCheck.error.format()),
      );
    }

    const rate = checkRate(actor.id, agentId);
    if (!rate.ok) {
      return err(
        AppError.tooManyRequests(
          `Rate limit exceeded. Try again in ${Math.ceil(rate.resetMs / 1000)}s.`,
        ),
      );
    }

    if (!hasSupabase()) {
      // Without DB we can still call the model, just not persist the
      // run. We log so it's obvious this happened.
      log.warn("ai.run without supabase — job will not be persisted", {
        agent: agentId,
      });
    }

    const job = hasSupabase()
      ? await tryAsync(
          () =>
            aiJobsRepository.create({
              agent: agentId,
              input: inputCheck.data,
              createdBy: actor.id,
            }),
          AppError.fromUnknown,
        )
      : ok({ id: "ephemeral" } as AiJob);
    if (!job.ok) return job;

    const startedAt = Date.now();
    const prompt = agent.buildPrompt(inputCheck.data);
    if (model) prompt.model = model;

    const completion = await tryAsync(
      () => llm.complete(prompt),
      AppError.fromUnknown,
    );
    const durationMs = Date.now() - startedAt;

    if (!completion.ok) {
      if (hasSupabase()) {
        await tryAsync(
          () =>
            aiJobsRepository.markFailed({
              id: job.value.id,
              error: completion.error.message,
              durationMs,
            }),
          AppError.fromUnknown,
        );
      }
      return completion;
    }

    let parsedOutput: unknown = undefined;
    if (prompt.json) {
      try {
        parsedOutput = JSON.parse(completion.value.text);
        const out = agent.outputSchema.safeParse(parsedOutput);
        if (out.success) {
          parsedOutput = out.data;
        } else {
          log.warn("agent output failed schema", {
            agent: agentId,
            issues: out.error.issues.slice(0, 5),
          });
        }
      } catch (e) {
        log.warn("agent output not JSON", {
          agent: agentId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (hasSupabase()) {
      await tryAsync(
        () =>
          aiJobsRepository.markSucceeded({
            id: job.value.id,
            output: {
              text: completion.value.text,
              parsed: parsedOutput ?? null,
              model: completion.value.model,
              provider: completion.value.provider,
            },
            costUsd: completion.value.usage.costUsd,
            durationMs,
          }),
        AppError.fromUnknown,
      );
    }

    return ok({
      jobId: job.value.id,
      agent: agentId,
      text: completion.value.text,
      parsed: parsedOutput,
      costUsd: completion.value.usage.costUsd,
      durationMs,
      model: completion.value.model,
      provider: completion.value.provider,
    });
  },
};
