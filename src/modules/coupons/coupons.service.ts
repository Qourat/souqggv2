import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";
import { hasSupabase } from "@/shared/db/has-supabase";

import { couponsRepository } from "./coupons.repository";
import {
  applyCouponSchema,
  upsertCouponSchema,
  type ApplyCouponInput,
  type UpsertCouponInput,
} from "./coupons.schema";
import type { Coupon } from "./coupons.types";

/**
 * Coupons service.
 *
 * Two roles:
 *   - admin: list / upsert / remove (validated via Zod, role-checked in
 *     the action layer).
 *   - public: applyToCart(code, subtotalCents, currency) — used by
 *     /api/checkout AND the cart's "preview" (so the buyer sees the
 *     discount before submitting). Returns a CouponResolution that the
 *     orders service then trusts when creating the order.
 *
 * The discount math is centralized here so cart UI and the order
 * creation path can never disagree.
 */

export interface CouponResolution {
  coupon: Coupon;
  discountCents: number;
  totalCents: number;
}

export const couponsService = {
  async listAll(): Promise<Result<Coupon[]>> {
    if (!hasSupabase()) return ok([]);
    return tryAsync(() => couponsRepository.listAll(), AppError.fromUnknown);
  },

  async getById(id: string): Promise<Result<Coupon | null>> {
    if (!id) return err(AppError.validation("id required"));
    if (!hasSupabase()) return ok(null);
    return tryAsync(
      () => couponsRepository.findById(id),
      AppError.fromUnknown,
    );
  },

  async upsert(rawInput: unknown): Promise<Result<Coupon>> {
    const parsed = upsertCouponSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid coupon", parsed.error.format()));
    }
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Supabase not configured"));
    }
    return tryAsync(
      () => couponsRepository.upsert(parsed.data as UpsertCouponInput),
      AppError.fromUnknown,
    );
  },

  async remove(id: string): Promise<Result<true>> {
    if (!id) return err(AppError.validation("id required"));
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Supabase not configured"));
    }
    const r = await tryAsync(
      () => couponsRepository.remove(id),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(true);
  },

  async applyToCart(
    rawInput: unknown,
  ): Promise<Result<CouponResolution>> {
    const parsed = applyCouponSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid input", parsed.error.format()));
    }
    const input = parsed.data as ApplyCouponInput;
    if (!hasSupabase()) {
      return err(AppError.notFound("Coupon"));
    }

    const found = await tryAsync(
      () => couponsRepository.findByCode(input.code),
      AppError.fromUnknown,
    );
    if (!found.ok) return found;
    const coupon = found.value;
    if (!coupon) return err(AppError.notFound("Coupon"));

    if (!coupon.isActive) return err(AppError.forbidden("Coupon inactive"));

    const now = Date.now();
    if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
      return err(AppError.forbidden("Coupon not yet active"));
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) {
      return err(AppError.forbidden("Coupon expired"));
    }
    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return err(AppError.forbidden("Coupon exhausted"));
    }
    if (input.subtotalCents < coupon.minOrderCents) {
      return err(
        AppError.validation(
          `Minimum order is ${(coupon.minOrderCents / 100).toFixed(2)}`,
        ),
      );
    }

    const discountCents = computeDiscountCents(
      input.subtotalCents,
      coupon.discountType,
      coupon.discountValue,
    );
    const totalCents = Math.max(0, input.subtotalCents - discountCents);

    return ok({ coupon, discountCents, totalCents });
  },
};

export function computeDiscountCents(
  subtotalCents: number,
  type: Coupon["discountType"],
  value: number,
): number {
  if (subtotalCents <= 0) return 0;
  if (type === "percent") {
    return Math.min(
      subtotalCents,
      Math.floor((subtotalCents * Math.max(0, Math.min(100, value))) / 100),
    );
  }
  return Math.min(subtotalCents, Math.max(0, value));
}
