import { tField, type LocalizedField } from "@/shared/i18n/localized-field";

import type { LibraryEntry } from "./downloads.types";

export interface LibraryItemDto {
  downloadId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  orderId: string;
  filename: string;
  sizeBytes: number;
  downloadCount: number;
  expiresAt: string | null;
  unitPriceCents: number;
  currency: string;
  paidAt: string | null;
}

export function toLibraryItemDto(
  entry: LibraryEntry,
  locale: string,
): LibraryItemDto {
  return {
    downloadId: entry.download.id,
    productId: entry.productId,
    productSlug: entry.productSlug,
    productTitle: tField(entry.productTitle as LocalizedField | null, locale),
    orderId: entry.orderId,
    filename: entry.file.filename,
    sizeBytes: entry.file.sizeBytes,
    downloadCount: entry.download.downloadCount,
    expiresAt: entry.download.expiresAt
      ? new Date(entry.download.expiresAt).toISOString()
      : null,
    unitPriceCents: entry.unitPriceCents,
    currency: entry.currency,
    paidAt: entry.paidAt,
  };
}
