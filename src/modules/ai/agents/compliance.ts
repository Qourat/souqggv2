import { z } from "zod";

import type { AiAgentDescriptor } from "../ai.types";
import type { LlmCompletionInput } from "@/shared/ai";

export const complianceDescriptor: AiAgentDescriptor = {
  id: "compliance",
  label: "compliance",
  description:
    "Pre-publish legal sweep: copyright risk, forbidden categories, PII inside file, fake claims.",
  budgetTokens: 4000,
  inputShape: [
    {
      name: "title",
      label: "Product title",
      kind: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description (AR or EN)",
      kind: "textarea",
      required: true,
    },
    {
      name: "license_type",
      label: "License",
      kind: "select",
      required: true,
      options: [
        { value: "personal", label: "Personal use" },
        { value: "commercial", label: "Commercial use" },
        { value: "extended", label: "Extended commercial" },
      ],
    },
  ],
};

export const complianceInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(20).max(8000),
  license_type: z.enum(["personal", "commercial", "extended"]),
});

export const complianceOutputSchema = z.object({
  decision: z.enum(["pass", "block"]),
  violations: z
    .array(
      z.object({
        rule: z.string(),
        evidence: z.string(),
      }),
    )
    .default([]),
  notes: z.string().default(""),
});

export function buildCompliancePrompt(
  input: z.infer<typeof complianceInputSchema>,
): LlmCompletionInput {
  const system = `You are SOUQ.GG's compliance agent. SOUQ.GG sells ONLY
legal digital products with clear rights. Never approve gray-market
goods, leaked courses, paid-software cracks, copyrighted templates
without rights, or any product that would expose buyer PII.

Forbidden categories include: leaked or "free download" of paid
courses; copyrighted brand assets; financial/legal/medical advice
posing as official; resale of free open-source assets without
substantial added value; anything that violates Saudi (KSA) law.

Decision policy:
- "block" if ANY rule is broken — list every violation with concrete
  evidence quoted from the title/description.
- Otherwise "pass" with notes explaining why borderline cases are OK.
- Reply with VALID JSON only.`;

  const user = `Compliance check.

Title: ${input.title}

Description:
${input.description}

License: ${input.license_type}

Reply as JSON with EXACTLY these keys:
{
  "decision": "pass" | "block",
  "violations": [{ "rule": string, "evidence": string }],
  "notes": string
}`;

  return {
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.1,
    maxTokens: 1500,
    json: true,
  };
}
