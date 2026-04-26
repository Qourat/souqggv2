import { z } from "zod";

export const COUPON_DISCOUNT_TYPES = ["percent", "amount"] as const;

const optionalDateString = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : null));

export const upsertCouponSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/i, "Letters, digits, dash, underscore only")
      .transform((v) => v.toUpperCase()),
    discountType: z.enum(COUPON_DISCOUNT_TYPES),
    discountValue: z.coerce
      .number()
      .int()
      .positive()
      .max(100000),
    minOrderCents: z.coerce.number().int().min(0).default(0),
    usageLimit: z
      .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
      .optional()
      .transform((v) =>
        v === null || v === undefined || v === "" ? null : Number(v),
      ),
    startsAt: optionalDateString,
    expiresAt: optionalDateString,
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    if (val.discountType === "percent" && val.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percent must be 1–100",
      });
    }
    if (
      val.startsAt &&
      val.expiresAt &&
      val.startsAt.getTime() > val.expiresAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "Expires must be after starts",
      });
    }
  });

export type UpsertCouponInput = z.infer<typeof upsertCouponSchema>;

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotalCents: z.coerce.number().int().min(0),
  currency: z.string().min(3).max(3).default("USD"),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
