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

const PRODUCT_TYPES = [
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
] as const;

const PRODUCT_STATUSES = ["draft", "review", "published", "archived"] as const;

const LICENSE_TYPES = [
  "personal_use",
  "business_use",
  "commercial_use",
  "resale_rights",
] as const;

const localizedFieldOptional = z
  .object(
    Object.fromEntries(LOCALE_CODES.map((c) => [c, z.string().optional()])),
  )
  .partial()
  .optional();

export const upsertProductSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, and dashes only"),
  categoryId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  type: z.enum(PRODUCT_TYPES),
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  title: localizedField,
  descriptionShort: localizedFieldOptional,
  descriptionLong: localizedFieldOptional,
  priceCents: z.coerce.number().int().nonnegative(),
  compareAtCents: z.coerce
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  currency: z.string().length(3).default("USD"),
  contentLanguages: z.array(z.string()).default([]),
  licenseType: z.enum(LICENSE_TYPES).default("personal_use"),
  downloadLimit: z.coerce.number().int().min(1).max(100).default(5),
  thumbnailUrl: z.string().url().nullable().optional().or(z.literal("")),
  isFeatured: z.coerce.boolean().default(false),
});

export const PRODUCT_TYPE_VALUES = PRODUCT_TYPES;
export const PRODUCT_STATUS_VALUES = PRODUCT_STATUSES;
export const LICENSE_TYPE_VALUES = LICENSE_TYPES;

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
