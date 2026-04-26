import type { ReviewRow } from "@/shared/db/schema";

export type Review = ReviewRow;
export type ReviewStatus = Review["status"];

export interface ReviewWithMeta extends Review {
  productSlug: string | null;
  productTitle: string | null;
  reviewerEmail: string | null;
  reviewerName: string | null;
}
