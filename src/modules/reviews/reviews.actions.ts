"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser } from "@/shared/auth/session";

import { reviewsService } from "./reviews.service";
import type { ReviewStatus } from "./reviews.types";

export interface ReviewActionState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function submitReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await requireUser();
  const raw = {
    productId: formData.get("productId") ?? "",
    orderId: formData.get("orderId") || undefined,
    rating: formData.get("rating") ?? 0,
    body: formData.get("body") ?? "",
  };

  const r = await reviewsService.submit(raw, user.id);
  if (!r.ok) {
    return {
      ok: false,
      message: r.error.message,
      errors:
        (r.error.details as Record<string, string[]> | undefined) ?? undefined,
    };
  }

  const slug = (formData.get("productSlug") as string | null) || null;
  if (slug) revalidatePath(`/[locale]/products/${slug}`, "page");
  revalidatePath("/admin/reviews", "page");
  return { ok: true, message: "Submitted" };
}

export async function moderateReviewAction(
  id: string,
  status: ReviewStatus,
): Promise<void> {
  const user = await requireAdmin();
  await reviewsService.moderate({ id, status }, user.id);
  revalidatePath("/admin/reviews", "page");
}

export async function deleteReviewAction(id: string): Promise<void> {
  const user = await requireAdmin();
  await reviewsService.remove(id, user.id);
  revalidatePath("/admin/reviews", "page");
}
