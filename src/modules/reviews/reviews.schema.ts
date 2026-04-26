import { z } from "zod";

export const REVIEW_STATUSES = ["pending", "approved", "hidden"] as const;

export const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  orderId: z.string().uuid().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const moderateReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(REVIEW_STATUSES),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
