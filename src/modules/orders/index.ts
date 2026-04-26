/**
 * Orders module — to be implemented in Sprint 2 (Checkout & Payments).
 *
 * Layout will mirror products/:
 *   orders.controller.ts  — server actions (createCheckoutSession, etc.)
 *   orders.service.ts     — business logic (cart → order, totals, coupons)
 *   orders.repository.ts  — Supabase queries
 *   orders.schema.ts      — Zod DTOs
 *   orders.resource.ts    — locale-aware DTOs for the UI
 *   orders.policy.ts      — only the buyer or admin can read an order
 */
export const ordersModule = { ready: false as const };
