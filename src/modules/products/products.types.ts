import type { ProductRow } from "@/shared/db/schema";

export type Product = ProductRow;

export interface ProductListFilters {
  q?: string;
  categorySlug?: string;
  type?: ProductRow["type"];
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
  contentLanguage?: string;
  isFeatured?: boolean;
}

export type ProductSort =
  | "best_selling"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating";
