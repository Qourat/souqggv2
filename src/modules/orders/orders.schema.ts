import { z } from "zod";

export const checkoutLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const createCheckoutSchema = z.object({
  email: z.string().email(),
  couponCode: z.string().trim().min(1).optional(),
  lines: z.array(checkoutLineSchema).min(1).max(50),
  locale: z.string().min(2).max(5).default("en"),
});

export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;
export type CreateCheckoutInputDto = z.infer<typeof createCheckoutSchema>;
