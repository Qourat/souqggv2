/**
 * Coupons module — Sprint 5.
 *
 * Layout mirrors orders/, downloads/, products/.
 * Server-only by design: no demo fallback (codes are meaningless without a
 * real DB), and write paths use the admin client so we never depend on
 * RLS being permissive for admins.
 */

export { couponsController } from "./coupons.controller";
export {
  couponsService,
  computeDiscountCents,
  type CouponResolution,
} from "./coupons.service";
export type { Coupon, CouponDiscountType } from "./coupons.types";
export {
  upsertCouponSchema,
  applyCouponSchema,
  COUPON_DISCOUNT_TYPES,
  type UpsertCouponInput,
  type ApplyCouponInput,
} from "./coupons.schema";
