import "server-only";

import { createSupabaseServerClient } from "@/shared/db/supabase/server";

import type { ProductListQuery } from "./products.schema";
import type { Product } from "./products.types";

/**
 * Repository = the only thing that talks to the database for this module.
 * Services call repositories; controllers call services. This keeps SQL out
 * of business logic and makes it cheap to swap data sources later.
 */

const SELECT = `
  id, slug, type, status, title, description_short, description_long,
  thumbnail_url, gallery_urls, price_cents, compare_at_cents, currency,
  content_languages, license_type, download_limit, is_featured, sales_count,
  rating_avg, rating_count, category_id, metadata,
  created_at, updated_at, published_at
`;

function applyFilters<T>(query: T, q: ProductListQuery): T {
  // narrowed via supabase chained calls — `query` is the PostgrestFilterBuilder
  let qb = query as unknown as {
    eq: (c: string, v: unknown) => typeof qb;
    gte: (c: string, v: unknown) => typeof qb;
    lte: (c: string, v: unknown) => typeof qb;
    contains: (c: string, v: unknown) => typeof qb;
    textSearch: (c: string, v: string, opts?: unknown) => typeof qb;
  };

  qb = qb.eq("status", "published");

  if (q.type) qb = qb.eq("type", q.type);
  if (q.isFeatured) qb = qb.eq("is_featured", true);
  if (typeof q.minPriceCents === "number") qb = qb.gte("price_cents", q.minPriceCents);
  if (typeof q.maxPriceCents === "number") qb = qb.lte("price_cents", q.maxPriceCents);
  if (typeof q.minRating === "number") qb = qb.gte("rating_avg", q.minRating);
  if (q.contentLanguage) qb = qb.contains("content_languages", [q.contentLanguage]);
  if (q.q) qb = qb.textSearch("search_text", q.q, { config: "simple", type: "websearch" });

  return qb as unknown as T;
}

function applySort<T>(query: T, sort: ProductListQuery["sort"]): T {
  const qb = query as unknown as {
    order: (c: string, opts?: { ascending?: boolean }) => typeof qb;
  };
  switch (sort) {
    case "newest":
      return qb.order("published_at", { ascending: false }) as unknown as T;
    case "price_asc":
      return qb.order("price_cents", { ascending: true }) as unknown as T;
    case "price_desc":
      return qb.order("price_cents", { ascending: false }) as unknown as T;
    case "rating":
      return qb.order("rating_avg", { ascending: false }) as unknown as T;
    case "best_selling":
    default:
      return qb.order("sales_count", { ascending: false }) as unknown as T;
  }
}

export const productsRepository = {
  async list(q: ProductListQuery): Promise<{ items: Product[]; total: number }> {
    const supabase = await createSupabaseServerClient();

    const from = (q.page - 1) * q.perPage;
    const to = from + q.perPage - 1;

    let query = supabase.from("products").select(SELECT, { count: "exact" });

    if (q.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", q.categorySlug)
        .single();
      if (cat?.id) query = query.eq("category_id", cat.id);
    }

    query = applyFilters(query, q);
    query = applySort(query, q.sort);
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      items: (data ?? []) as unknown as Product[],
      total: count ?? 0,
    };
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as Product) ?? null;
  },

  async findFeatured(limit = 6): Promise<Product[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("status", "published")
      .eq("is_featured", true)
      .order("sales_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
};
