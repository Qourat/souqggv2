import "server-only";

import { z } from "zod";

import type { LlmCompletionInput } from "@/shared/ai";

import {
  complianceDescriptor,
  complianceInputSchema,
  complianceOutputSchema,
  buildCompliancePrompt,
} from "./compliance";
import {
  listingDescriptor,
  listingInputSchema,
  listingOutputSchema,
  buildListingPrompt,
} from "./listing";
import {
  marketingDescriptor,
  marketingInputSchema,
  marketingOutputSchema,
  buildMarketingPrompt,
} from "./marketing";
import {
  qaDescriptor,
  qaInputSchema,
  qaOutputSchema,
  buildQaPrompt,
} from "./qa";
import {
  seoDescriptor,
  seoInputSchema,
  seoOutputSchema,
  buildSeoPrompt,
} from "./seo";

import type { AiAgentDescriptor, AiAgentId } from "../ai.types";

/**
 * Agent registry. One entry per agent. The shape is deliberately
 * homogeneous so the service layer can drive every agent with the
 * same code path (validate → prompt → call llm → parse → persist).
 */
export interface AgentDefinition<
  TInput extends Record<string, unknown> = Record<string, unknown>,
> {
  descriptor: AiAgentDescriptor;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<unknown>;
  buildPrompt: (input: TInput) => LlmCompletionInput;
}

const REGISTRY: Record<AiAgentId, AgentDefinition> = {
  listing: {
    descriptor: listingDescriptor,
    inputSchema: listingInputSchema as unknown as z.ZodType<
      Record<string, unknown>
    >,
    outputSchema: listingOutputSchema,
    buildPrompt: (i) =>
      buildListingPrompt(i as unknown as z.infer<typeof listingInputSchema>),
  },
  seo: {
    descriptor: seoDescriptor,
    inputSchema: seoInputSchema as unknown as z.ZodType<
      Record<string, unknown>
    >,
    outputSchema: seoOutputSchema,
    buildPrompt: (i) =>
      buildSeoPrompt(i as unknown as z.infer<typeof seoInputSchema>),
  },
  marketing: {
    descriptor: marketingDescriptor,
    inputSchema: marketingInputSchema as unknown as z.ZodType<
      Record<string, unknown>
    >,
    outputSchema: marketingOutputSchema,
    buildPrompt: (i) =>
      buildMarketingPrompt(
        i as unknown as z.infer<typeof marketingInputSchema>,
      ),
  },
  qa: {
    descriptor: qaDescriptor,
    inputSchema: qaInputSchema as unknown as z.ZodType<
      Record<string, unknown>
    >,
    outputSchema: qaOutputSchema,
    buildPrompt: (i) =>
      buildQaPrompt(i as unknown as z.infer<typeof qaInputSchema>),
  },
  compliance: {
    descriptor: complianceDescriptor,
    inputSchema: complianceInputSchema as unknown as z.ZodType<
      Record<string, unknown>
    >,
    outputSchema: complianceOutputSchema,
    buildPrompt: (i) =>
      buildCompliancePrompt(
        i as unknown as z.infer<typeof complianceInputSchema>,
      ),
  },
};

export function getAgent(id: AiAgentId): AgentDefinition {
  return REGISTRY[id];
}

export function listAgents(): AgentDefinition[] {
  return Object.values(REGISTRY);
}

export const AGENT_IDS = Object.keys(REGISTRY) as AiAgentId[];
