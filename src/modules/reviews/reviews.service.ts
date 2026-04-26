import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";
import { logger } from "@/core/logger";
import { hasSupabase } from "@/shared/db/has-supabase";

import { auditService } from "@/modules/audit";

import {
  reviewsRepository,
  type ListReviewsOptions,
} from "./reviews.repository";
import {
  submitReviewSchema,
  moderateReviewSchema,
  type SubmitReviewInput,
} from "./reviews.schema";
import type { Review, ReviewStatus, ReviewWithMeta } from "./reviews.types";

const log = logger("reviews.service");

/**
 * Reviews service.
 *
 * Two roles:
 *   - buyer: submit() — must have purchased the product. New reviews land
 *     in 'pending' state. Editing an existing review (one-per-product
 *     per-user) resets it to pending so a moderator re-approves.
 *   - admin: list / moderate / remove — moderation queue at /admin/reviews.
 *     Crossing the approved/not-approved boundary triggers a stats
 *     recompute so /shop and product detail update immediately.
 *
 * Recompute is best-effort: a stats failure is logged but does NOT roll
 * back the moderation action — the worst case is the cache lags by a
 * page reload until the next moderation event.
 */
export const reviewsService = {
  async submit(
    rawInput: unknown,
    userId: string,
  ): Promise<Result<Review>> {
    const parsed = submitReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid review", parsed.error.format()));
    }
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Supabase not configured"));
    }
    const input = parsed.data as SubmitReviewInput;

    const purchased = await tryAsync(
      () => reviewsRepository.userHasPurchased(userId, input.productId),
      AppError.fromUnknown,
    );
    if (!purchased.ok) return purchased;
    if (!purchased.value.purchased) {
      return err(
        AppError.forbidden("You must purchase this product before reviewing"),
      );
    }

    const inputWithOrder: SubmitReviewInput = {
      ...input,
      orderId: input.orderId ?? purchased.value.orderId,
    };

    const saved = await tryAsync(
      () => reviewsRepository.upsertOwn(inputWithOrder, userId),
      AppError.fromUnknown,
    );
    if (!saved.ok) return saved;

    await auditService.log({
      actorId: userId,
      action: "review.submit",
      entityType: "review",
      entityId: saved.value.id,
      diff: {
        productId: saved.value.productId,
        rating: saved.value.rating,
        hasBody: Boolean(saved.value.body),
      },
    });

    return ok(saved.value);
  },

  async getMyForProduct(
    productId: string,
    userId: string,
  ): Promise<Result<Review | null>> {
    if (!hasSupabase()) return ok(null);
    return tryAsync(
      () => reviewsRepository.findOwnForProduct(productId, userId),
      AppError.fromUnknown,
    );
  },

  async userHasPurchased(
    productId: string,
    userId: string,
  ): Promise<Result<{ purchased: boolean; orderId: string | null }>> {
    if (!hasSupabase()) return ok({ purchased: false, orderId: null });
    return tryAsync(
      () => reviewsRepository.userHasPurchased(userId, productId),
      AppError.fromUnknown,
    );
  },

  async listApprovedForProduct(
    productId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<Result<{ rows: Review[]; total: number }>> {
    if (!hasSupabase()) return ok({ rows: [], total: 0 });
    return tryAsync(
      () => reviewsRepository.listApprovedForProduct(productId, options),
      AppError.fromUnknown,
    );
  },

  async listForAdmin(
    options: ListReviewsOptions = {},
  ): Promise<Result<{ rows: ReviewWithMeta[]; total: number }>> {
    if (!hasSupabase()) return ok({ rows: [], total: 0 });
    return tryAsync(
      () => reviewsRepository.listForAdmin(options),
      AppError.fromUnknown,
    );
  },

  async moderate(
    rawInput: unknown,
    actorId: string,
  ): Promise<Result<Review>> {
    const parsed = moderateReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(
        AppError.validation("Invalid moderation", parsed.error.format()),
      );
    }
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Supabase not configured"));
    }

    const before = await tryAsync(
      () => reviewsRepository.findById(parsed.data.id),
      AppError.fromUnknown,
    );
    if (!before.ok) return before;
    if (!before.value) return err(AppError.notFound("Review"));

    const updated = await tryAsync(
      () => reviewsRepository.setStatus(parsed.data.id, parsed.data.status),
      AppError.fromUnknown,
    );
    if (!updated.ok) return updated;

    await this.recomputeIfNeeded(
      updated.value.productId,
      before.value.status,
      updated.value.status,
    );

    await auditService.log({
      actorId,
      action: `review.${updated.value.status}`,
      entityType: "review",
      entityId: updated.value.id,
      diff: {
        productId: updated.value.productId,
        from: before.value.status,
        to: updated.value.status,
      },
    });

    return ok(updated.value);
  },

  async remove(id: string, actorId: string): Promise<Result<true>> {
    if (!id) return err(AppError.validation("id required"));
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Supabase not configured"));
    }

    const before = await tryAsync(
      () => reviewsRepository.findById(id),
      AppError.fromUnknown,
    );
    if (!before.ok) return before;
    if (!before.value) return err(AppError.notFound("Review"));

    const removed = await tryAsync(
      () => reviewsRepository.remove(id),
      AppError.fromUnknown,
    );
    if (!removed.ok) return removed;

    if (before.value.status === "approved") {
      await tryAsync(
        () => reviewsRepository.recomputeProductStats(before.value!.productId),
        AppError.fromUnknown,
      );
    }

    await auditService.log({
      actorId,
      action: "review.delete",
      entityType: "review",
      entityId: id,
      diff: {
        productId: before.value.productId,
        previousStatus: before.value.status,
        rating: before.value.rating,
      },
    });

    return ok(true);
  },

  async recomputeIfNeeded(
    productId: string,
    fromStatus: ReviewStatus,
    toStatus: ReviewStatus,
  ): Promise<void> {
    if (fromStatus === toStatus) return;
    const wasApproved = fromStatus === "approved";
    const isApproved = toStatus === "approved";
    if (!wasApproved && !isApproved) return;
    const r = await tryAsync(
      () => reviewsRepository.recomputeProductStats(productId),
      AppError.fromUnknown,
    );
    if (!r.ok) {
      log.error("rating recompute failed", {
        productId,
        message: r.error.message,
      });
    }
  },
};
