import type { DownloadRow, ProductFileRow } from "@/shared/db/schema";

export type Download = DownloadRow;
export type ProductFile = ProductFileRow;

export interface LibraryEntry {
  download: Download;
  file: ProductFile;
  productId: string;
  productSlug: string;
  productTitle: Record<string, string>;
  orderId: string;
  orderItemId: string;
  unitPriceCents: number;
  currency: string;
  paidAt: string | null;
}
