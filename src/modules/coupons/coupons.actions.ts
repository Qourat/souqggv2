"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";

import { couponsService } from "./coupons.service";

export interface CouponActionState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function upsertCouponAction(
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  await requireAdmin();
  const raw = {
    id: formData.get("id") || undefined,
    code: formData.get("code") ?? "",
    discountType: formData.get("discountType") ?? "percent",
    discountValue: formData.get("discountValue"),
    minOrderCents: formData.get("minOrderCents") ?? 0,
    usageLimit: formData.get("usageLimit") ?? null,
    startsAt: formData.get("startsAt") || null,
    expiresAt: formData.get("expiresAt") || null,
    isActive: formData.get("isActive") === "on",
  };

  const result = await couponsService.upsert(raw);
  if (!result.ok) {
    return {
      ok: false,
      message: result.error.message,
      errors:
        (result.error.details as Record<string, string[]> | undefined) ??
        undefined,
    };
  }

  revalidatePath("/admin/coupons", "page");
  return { ok: true, message: "Saved" };
}

export async function deleteCouponAction(id: string): Promise<void> {
  await requireAdmin();
  await couponsService.remove(id);
  revalidatePath("/admin/coupons", "page");
}

export async function previewCouponAction(input: {
  code: string;
  subtotalCents: number;
  currency: string;
}): Promise<{
  ok: boolean;
  code?: string;
  message?: string;
  discountCents?: number;
  totalCents?: number;
  discountLabel?: string;
}> {
  const result = await couponsService.applyToCart(input);
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }
  const { coupon, discountCents, totalCents } = result.value;
  const discountLabel =
    coupon.discountType === "percent"
      ? `${coupon.discountValue}% off`
      : `${(coupon.discountValue / 100).toFixed(2)} off`;
  return {
    ok: true,
    code: coupon.code,
    discountCents,
    totalCents,
    discountLabel,
  };
}
