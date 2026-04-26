import "server-only";

import { reviewsService } from "./reviews.service";
import type { ListReviewsOptions } from "./reviews.repository";
import type { Review, ReviewWithMeta } from "./reviews.types";

export const reviewsController = {
  async listApprovedForProduct(
    productId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ rows: Review[]; total: number }> {
    const r = await reviewsService.listApprovedForProduct(productId, options);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async getMyForProduct(
    productId: string,
    userId: string,
  ): Promise<Review | null> {
    const r = await reviewsService.getMyForProduct(productId, userId);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async userHasPurchased(
    productId: string,
    userId: string,
  ): Promise<{ purchased: boolean; orderId: string | null }> {
    const r = await reviewsService.userHasPurchased(productId, userId);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async listForAdmin(
    options: ListReviewsOptions = {},
  ): Promise<{ rows: ReviewWithMeta[]; total: number }> {
    const r = await reviewsService.listForAdmin(options);
    if (!r.ok) throw r.error;
    return r.value;
  },
};
