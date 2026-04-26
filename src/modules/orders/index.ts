/**
 * Orders module — Sprint 3 (Checkout & Payments).
 *
 * Layout mirrors products/:
 *   orders.controller.ts  — server-side glue used by pages
 *   orders.service.ts     — business logic (cart → order, totals, fulfilment)
 *   orders.repository.ts  — Supabase queries (no demo fallback; orders need
 *                           a real DB or they're meaningless)
 *   orders.resource.ts    — locale-aware DTOs for the UI
 *   orders.schema.ts      — Zod validation for the checkout payload
 *
 * The cart store lives in `@/modules/cart` and is purely client-side; the
 * orders service is the only thing that turns a cart into something
 * persisted and chargeable.
 */

export { ordersController } from "./orders.controller";
export { ordersService } from "./orders.service";
export type { OrderDto, OrderItemDto } from "./orders.resource";
export {
  createCheckoutSchema,
  type CreateCheckoutInputDto,
} from "./orders.schema";
