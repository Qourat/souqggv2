import { tField, type LocalizedField } from "@/shared/i18n/localized-field";

import type { Product } from "./products.types";

/**
 * Resource transformer = Laravel's API Resource. Shapes domain rows into
 * a stable, locale-aware DTO that the UI consumes. The UI never sees raw
 * database fields, only this DTO. Adding/removing DB columns is a one-file
 * change, not a hunt across components.
 */

export interface ProductDto {
  id: string;
  slug: string;
  type: Product["type"];
  title: string;
  descriptionShort: string;
  descriptionLong: string;
  bullets: string[];
  thumbnailUrl: string | null;
  galleryUrls: string[];
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  isOnSale: boolean;
  discountPct: number | null;
  isFeatured: boolean;
  contentLanguages: string[];
  licenseType: Product["licenseType"];
  downloadLimit: number;
  salesCount: number;
  ratingAvg: number;
  ratingCount: number;
  publishedAt: string | null;
}

export function toProductDto(p: Product, locale: string): ProductDto {
  const compare = p.compareAtCents ?? null;
  const isOnSale =
    typeof compare === "number" && compare > 0 && compare > p.priceCents;
  const discountPct = isOnSale && compare
    ? Math.round(((compare - p.priceCents) / compare) * 100)
    : null;

  const bulletsRaw = (p.bullets ?? []) as LocalizedField[] | null;
  const bullets = (bulletsRaw ?? [])
    .map((b) => tField(b, locale))
    .filter((s): s is string => Boolean(s));

  return {
    id: p.id,
    slug: p.slug,
    type: p.type,
    title: tField(p.title as LocalizedField | null, locale),
    descriptionShort: tField(p.descriptionShort as LocalizedField | null, locale),
    descriptionLong: tField(p.descriptionLong as LocalizedField | null, locale),
    bullets,
    thumbnailUrl: p.thumbnailUrl ?? null,
    galleryUrls: (p.galleryUrls as string[] | null) ?? [],
    priceCents: p.priceCents,
    compareAtCents: compare,
    currency: p.currency,
    isOnSale,
    discountPct,
    isFeatured: p.isFeatured,
    contentLanguages: (p.contentLanguages as string[] | null) ?? [],
    licenseType: p.licenseType,
    downloadLimit: p.downloadLimit,
    salesCount: p.salesCount,
    ratingAvg: Number(p.ratingAvg ?? 0),
    ratingCount: p.ratingCount,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
  };
}

export function toProductDtoList(rows: Product[], locale: string): ProductDto[] {
  return rows.map((r) => toProductDto(r, locale));
}
