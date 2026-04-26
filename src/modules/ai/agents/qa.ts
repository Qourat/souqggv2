import { z } from "zod";

import type { AiAgentDescriptor } from "../ai.types";
import type { LlmCompletionInput } from "@/shared/ai";

export const qaDescriptor: AiAgentDescriptor = {
  id: "qa",
  label: "qa",
  description:
    "Pre-publish quality review: clarity, grammar, missing info, license red flags.",
  budgetTokens: 5000,
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
      name: "files_summary",
      label: "Files summary",
      kind: "textarea",
      required: false,
      placeholder: "Filenames + a one-line description of each file (optional).",
    },
  ],
};

export const qaInputSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(20).max(8000),
  files_summary: z.string().max(2000).optional().default(""),
});

export const qaOutputSchema = z.object({
  decision: z.enum(["approve", "request_fixes", "reject"]),
  issues: z
    .array(
      z.object({
        severity: z.enum(["low", "med", "high"]),
        field: z.string(),
        note: z.string(),
      }),
    )
    .default([]),
  required_fixes: z.array(z.string()).default([]),
  summary: z.string(),
});

export function buildQaPrompt(
  input: z.infer<typeof qaInputSchema>,
): LlmCompletionInput {
  const system = `You are SOUQ.GG's QA agent. Block anything that looks
like a leaked course, copyrighted material without rights, or
misleading claims. Otherwise default to "approve".

Rules:
- Severity scale: low | med | high.
- "reject" means the product MUST NOT publish (legal/safety).
- "request_fixes" means the admin can edit and re-run.
- "approve" means good to publish as-is.
- Reply with VALID JSON only.`;

  const user = `QA review.

Title: ${input.title}

Description:
${input.description}

Files summary:
${input.files_summary || "(not provided)"}

Reply as JSON with EXACTLY these keys:
{
  "decision": "approve" | "request_fixes" | "reject",
  "issues": [{ "severity": "low"|"med"|"high", "field": string, "note": string }],
  "required_fixes": string[],
  "summary": string
}`;

  return {
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.2,
    maxTokens: 1500,
    json: true,
  };
}
