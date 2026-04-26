/**
 * Reviews module — Sprint 7 polish.
 *
 * Layout mirrors coupons/, audit/. Server-only.
 *
 * Buyer flow:
 *   - submit() — must own a paid/fulfilled order containing the product;
 *     unique per (product, user); editing resets to 'pending'.
 *
 * Admin flow:
 *   - listForAdmin({ status }) — moderation queue.
 *   - moderate({ id, status }) — approve/hide/pending.
 *   - remove(id) — hard delete.
 *
 * Side effects:
 *   - Crossing the approved boundary recomputes products.rating_avg and
 *     products.rating_count from approved rows.
 *   - Every submit/moderate/remove writes a best-effort audit_log entry.
 */

export { reviewsController } from "./reviews.controller";
export { reviewsService } from "./reviews.service";
export type {
  Review,
  ReviewStatus,
  ReviewWithMeta,
} from "./reviews.types";
export type { ListReviewsOptions } from "./reviews.repository";
export {
  submitReviewSchema,
  moderateReviewSchema,
  REVIEW_STATUSES,
  type SubmitReviewInput,
  type ModerateReviewInput,
} from "./reviews.schema";

// Actions are imported DIRECTLY from "@/modules/reviews/reviews.actions"
// by client components — re-exporting them here would force Next.js to
// bundle the server-only controller/service into the client chunk.
