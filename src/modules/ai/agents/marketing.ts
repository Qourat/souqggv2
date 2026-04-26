import { z } from "zod";

import type { AiAgentDescriptor } from "../ai.types";
import type { LlmCompletionInput } from "@/shared/ai";

export const marketingDescriptor: AiAgentDescriptor = {
  id: "marketing",
  label: "marketing",
  description:
    "TikTok / Instagram / Pinterest / email / Telegram launch pack for a single product.",
  budgetTokens: 6000,
  inputShape: [
    {
      name: "title_ar",
      label: "Product title (Arabic)",
      kind: "text",
      required: true,
    },
    {
      name: "benefit",
      label: "Main benefit (one line)",
      kind: "text",
      required: true,
      placeholder: "e.g. ينظم مهام عملك في يوم واحد",
    },
    {
      name: "audience",
      label: "Audience",
      kind: "text",
      required: true,
    },
    {
      name: "product_url",
      label: "Product URL",
      kind: "text",
      required: true,
      placeholder: "https://souq.gg/ar/products/...",
    },
  ],
};

export const marketingInputSchema = z.object({
  title_ar: z.string().min(2).max(200),
  benefit: z.string().min(3).max(200),
  audience: z.string().min(2).max(200),
  product_url: z.string().url(),
});

export const marketingOutputSchema = z.object({
  tiktok: z.object({
    hook: z.string(),
    script: z.string(),
    captions: z.array(z.string()).min(1),
    hashtags: z.array(z.string()).min(3),
  }),
  instagram: z.object({
    post: z.string(),
    carousel_slides: z.array(z.string()).min(3),
    hashtags: z.array(z.string()).min(3),
  }),
  pinterest: z.object({
    pin_title: z.string(),
    pin_description: z.string(),
  }),
  email: z.object({
    subject: z.string(),
    preview: z.string(),
    body_ar: z.string(),
    body_en: z.string(),
  }),
  telegram: z.object({
    post_ar: z.string(),
  }),
});

export function buildMarketingPrompt(
  input: z.infer<typeof marketingInputSchema>,
): LlmCompletionInput {
  const system = `You are SOUQ.GG's marketing agent. Voice: practical,
confident, slightly nerdy — match the retro-compact site vibe. Arabic
is primary; English only when the channel demands it.

Rules:
- No "miracle results" or income guarantees.
- One CTA per post: link to the product URL.
- TikTok hook is 3 seconds max; the script is 15-30 seconds.
- Pinterest pin_title <= 80 chars, pin_description <= 500 chars.
- Email subject <= 60 chars; preview <= 90 chars.
- Reply with VALID JSON only.`;

  const user = `Generate a launch pack.

Title (AR): ${input.title_ar}
Benefit: ${input.benefit}
Audience: ${input.audience}
Product URL: ${input.product_url}

Reply as JSON with EXACTLY these keys:
{
  "tiktok": { "hook": string, "script": string, "captions": string[], "hashtags": string[] },
  "instagram": { "post": string, "carousel_slides": string[], "hashtags": string[] },
  "pinterest": { "pin_title": string, "pin_description": string },
  "email": { "subject": string, "preview": string, "body_ar": string, "body_en": string },
  "telegram": { "post_ar": string }
}`;

  return {
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.6,
    maxTokens: 2500,
    json: true,
  };
}
