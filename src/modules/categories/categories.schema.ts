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

const localizedFieldOptional = z
  .object(
    Object.fromEntries(LOCALE_CODES.map((c) => [c, z.string().optional()])),
  )
  .partial()
  .optional();

export const upsertCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, and dashes only"),
  name: localizedField,
  description: localizedFieldOptional,
  icon: z.string().max(40).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;
