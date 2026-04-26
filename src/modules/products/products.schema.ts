import { z } from "zod";

import { LOCALE_CODES } from "@/shared/i18n/locales";

const localizedField = z
  .object(
    Object.fromEntries(LOCALE_CODES.map((c) => [c, z.string().optional()])),
  )
  .partial()
  .refine(
    (v) => Object.values(v).some((s) => typeof s === "string" && s.length > 0),
    { message: "At least one locale must be filled" },
  );

export const productSortSchema = z.enum([
  "best_selling",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
]);

export const productListQuerySchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  type: z
    .enum([
      "pdf",
      "excel",
      "word",
      "notion",
      "prompt_pack",
      "template",
      "course",
      "code",
      "dataset",
      "bundle",
      "mixed",
    ])
    .optional(),
  minPriceCents: z.coerce.number().int().nonnegative().optional(),
  maxPriceCents: z.coerce.number().int().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  contentLanguage: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  sort: productSortSchema.default("best_selling"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24),
});

export const createProductSchema = z.object({
  slug: z.string().min(2).max(120),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum([
    "pdf",
    "excel",
    "word",
    "notion",
    "prompt_pack",
    "template",
    "course",
    "code",
    "dataset",
    "bundle",
    "mixed",
  ]),
  title: localizedField,
  descriptionShort: localizedField.optional(),
  descriptionLong: localizedField.optional(),
  priceCents: z.number().int().nonnegative(),
  compareAtCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().length(3).default("USD"),
  contentLanguages: z.array(z.string()).default([]),
  licenseType: z
    .enum(["personal_use", "business_use", "commercial_use", "resale_rights"])
    .default("personal_use"),
  downloadLimit: z.number().int().min(1).max(100).default(5),
  thumbnailUrl: z.string().url().nullable().optional(),
  isFeatured: z.boolean().default(false),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
