import { z } from "zod";

import type { AiAgentDescriptor } from "../ai.types";
import type { LlmCompletionInput } from "@/shared/ai";

export const seoDescriptor: AiAgentDescriptor = {
  id: "seo",
  label: "seo",
  description:
    "Title + meta description + keyword sets + URL slug, Arabic-primary, English-secondary.",
  budgetTokens: 4000,
  inputShape: [
    {
      name: "title_ar",
      label: "Arabic title",
      kind: "text",
      required: true,
      placeholder: "العنوان كما سيظهر للمشتري",
    },
    {
      name: "title_en",
      label: "English title",
      kind: "text",
      placeholder: "English working title (optional)",
    },
    {
      name: "summary",
      label: "What does the product do?",
      kind: "textarea",
      required: true,
    },
  ],
};

export const seoInputSchema = z.object({
  title_ar: z.string().min(2).max(200),
  title_en: z.string().max(200).optional().default(""),
  summary: z.string().min(10).max(2000),
});

export const seoOutputSchema = z.object({
  seo_title: z.string().max(70),
  seo_description: z.string().max(170),
  keywords_ar: z.array(z.string()).min(3).max(15),
  keywords_en: z.array(z.string()).min(3).max(15),
  slug: z.string().max(80),
});

export function buildSeoPrompt(
  input: z.infer<typeof seoInputSchema>,
): LlmCompletionInput {
  const system = `You are SOUQ.GG's SEO agent. Optimize for Khaleeji (Gulf
Arabic) buyer search intent first, then English as a secondary signal.

Rules:
- seo_title <= 60 chars; primary keyword in the first 30 chars.
- seo_description <= 155 chars, must read like a benefit, not a slogan.
- keywords_ar must include dialect variants when relevant (e.g.
  "محل" vs "متجر"). 5-8 items.
- keywords_en parallel to keywords_ar, 5-8 items.
- slug: ASCII only, lowercase, words joined with "-", max 80 chars.
- No keyword stuffing, no clickbait.
- Reply with VALID JSON only.`;

  const user = `Generate SEO metadata.

Arabic title: ${input.title_ar}
English title: ${input.title_en || "(none)"}
Summary: ${input.summary}

Reply as JSON with these EXACT keys:
{
  "seo_title": string,
  "seo_description": string,
  "keywords_ar": string[],
  "keywords_en": string[],
  "slug": string
}`;

  return {
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.3,
    maxTokens: 800,
    json: true,
  };
}
