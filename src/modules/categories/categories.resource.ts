import { tField, type LocalizedField } from "@/shared/i18n/localized-field";
import type { CategoryRow } from "@/shared/db/schema";

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  sortOrder: number;
}

export function toCategoryDto(c: CategoryRow, locale: string): CategoryDto {
  return {
    id: c.id,
    slug: c.slug,
    name: tField(c.name as LocalizedField | null, locale),
    description: tField(c.description as LocalizedField | null, locale),
    icon: c.icon ?? null,
    sortOrder: c.sortOrder,
  };
}
