"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";
import { auditService } from "@/modules/audit";

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
  const actor = await requireAdmin();
  const idValue = formData.get("id");
  const isUpdate = Boolean(idValue);
  const raw = {
    id: idValue || undefined,
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

  await auditService.log({
    actorId: actor.id,
    action: isUpdate ? "coupon.update" : "coupon.create",
    entityType: "coupon",
    entityId: result.value.id,
    diff: {
      code: result.value.code,
      discountType: result.value.discountType,
      discountValue: result.value.discountValue,
      isActive: result.value.isActive,
      usageLimit: result.value.usageLimit,
    },
  });

  revalidatePath("/admin/coupons", "page");
  return { ok: true, message: "Saved" };
}

export async function deleteCouponAction(id: string): Promise<void> {
  const actor = await requireAdmin();
  await couponsService.remove(id);
  await auditService.log({
    actorId: actor.id,
    action: "coupon.delete",
    entityType: "coupon",
    entityId: id,
  });
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
