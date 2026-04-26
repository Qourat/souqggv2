import { z } from "zod";

import type { AiAgentDescriptor } from "../ai.types";
import type { LlmCompletionInput } from "@/shared/ai";

export const listingDescriptor: AiAgentDescriptor = {
  id: "listing",
  label: "listing",
  description:
    "Generate a polished product listing — bilingual title, short + long descriptions, tags, suggested price.",
  budgetTokens: 6000,
  inputShape: [
    {
      name: "topic",
      label: "Topic / niche",
      kind: "text",
      required: true,
      placeholder: "e.g. Notion second-brain template for founders",
    },
    {
      name: "audience",
      label: "Target audience",
      kind: "text",
      required: true,
      placeholder: "e.g. Saudi small-business owners, students, freelancers",
    },
    {
      name: "format",
      label: "Format",
      kind: "select",
      required: true,
      options: [
        { value: "pdf", label: "PDF" },
        { value: "excel", label: "Excel" },
        { value: "prompt_pack", label: "Prompt pack" },
        { value: "template", label: "Template" },
        { value: "course", label: "Course" },
      ],
    },
    {
      name: "notes",
      label: "Notes (optional)",
      kind: "textarea",
      placeholder: "Anything special you want highlighted: included files, tools used, level…",
    },
  ],
};

export const listingInputSchema = z.object({
  topic: z.string().min(3).max(200),
  audience: z.string().min(3).max(200),
  format: z.enum(["pdf", "excel", "prompt_pack", "template", "course"]),
  notes: z.string().max(2000).optional().default(""),
});

export const listingOutputSchema = z.object({
  title_ar: z.string(),
  title_en: z.string(),
  short_description_ar: z.string().max(200),
  short_description_en: z.string().max(200),
  full_description_ar: z.string(),
  full_description_en: z.string(),
  tags: z.array(z.string()).min(3).max(12),
  suggested_price_sar: z.number().positive(),
  bullets: z.array(z.string()).min(3).max(8),
});

export function buildListingPrompt(
  input: z.infer<typeof listingInputSchema>,
): LlmCompletionInput {
  const system = `You are SOUQ.GG's listing agent. SOUQ.GG sells legitimate digital
products (PDFs, templates, prompt packs, spreadsheets, courses) to an
Arabic-first audience in the Gulf. Write for buyers who want practical,
benefit-first listings. Arabic is the primary locale; English is a
parallel translation.

Hard rules:
- Benefit-first hook in the first sentence.
- No fake urgency, scarcity, or guarantees ("100% guaranteed", "secret method", etc.).
- Tags must be lowercase and contain Arabic + English terms.
- Last paragraph of full_description_ar is always a "ماذا ستحصل" bullet list.
- Reply with VALID JSON only, no prose, no fences.`;

  const user = `Generate a product listing.

Topic: ${input.topic}
Audience: ${input.audience}
Format: ${input.format}
Notes: ${input.notes || "(none)"}

Reply as JSON with EXACTLY these keys:
{
  "title_ar": string,
  "title_en": string,
  "short_description_ar": string (max 160 chars),
  "short_description_en": string (max 160 chars),
  "full_description_ar": string (markdown, 200-500 words),
  "full_description_en": string (markdown, 200-500 words),
  "tags": string[] (5-8 items, lowercase),
  "suggested_price_sar": number,
  "bullets": string[] (3-8 items, what's included)
}`;

  return {
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.5,
    maxTokens: 2500,
    json: true,
  };
}
