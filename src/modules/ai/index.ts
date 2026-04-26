/**
 * AI module — internal admin tools only. Each agent (research, creation,
 * QA, compliance, listing, SEO, marketing, ops) gets its own subfolder
 * and writes into the `ai_jobs` table for traceability + cost accounting.
 */
export const aiModule = { ready: false as const };
