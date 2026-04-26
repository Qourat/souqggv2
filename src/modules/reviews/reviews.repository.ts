import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";
import {
  tField,
  type LocalizedField,
} from "@/shared/i18n/localized-field";

import type { Review, ReviewStatus, ReviewWithMeta } from "./reviews.types";
import type { SubmitReviewInput } from "./reviews.schema";

interface RawReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  body: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

function toReview(r: RawReview): Review {
  return {
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    orderId: r.order_id,
    rating: r.rating,
    body: r.body,
    status: r.status,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  } as Review;
}

export interface ListReviewsOptions {
  status?: ReviewStatus;
  productId?: string;
  limit?: number;
  offset?: number;
  locale?: string;
}

interface RawProductLite {
  id: string;
  slug: string;
  title: Record<string, string> | null;
}

interface RawProfileLite {
  id: string;
  display_name: string | null;
  email: string | null;
}

export const reviewsRepository = {
  async insert(input: SubmitReviewInput, userId: string): Promise<Review> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: input.productId,
        user_id: userId,
        order_id: input.orderId ?? null,
        rating: input.rating,
        body: input.body,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;
    return toReview(data as unknown as RawReview);
  },

  async upsertOwn(input: SubmitReviewInput, userId: string): Promise<Review> {
    // One review per (product, user) pair. Editing resets the status back
    // to pending so a moderator can re-approve.
    const supabase = createSupabaseAdminClient();
    const { data: existing, error: existingErr } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", input.productId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingErr && existingErr.code !== "PGRST116") throw existingErr;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating: input.rating,
          body: input.body,
          status: "pending",
          order_id: input.orderId ?? null,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return toReview(data as unknown as RawReview);
    }

    return this.insert(input, userId);
  },

  async findById(id: string): Promise<Review | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toReview(data as unknown as RawReview) : null;
  },

  async findOwnForProduct(
    productId: string,
    userId: string,
  ): Promise<Review | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toReview(data as unknown as RawReview) : null;
  },

  async listApprovedForProduct(
    productId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ rows: Review[]; total: number }> {
    const supabase = createSupabaseAdminClient();
    let q = supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (options.limit !== undefined) {
      const offset = options.offset ?? 0;
      q = q.range(offset, offset + options.limit - 1);
    }
    const { data, error, count } = await q;
    if (error) throw error;
    return {
      rows: ((data ?? []) as unknown as RawReview[]).map(toReview),
      total: count ?? 0,
    };
  },

  async listForAdmin(
    options: ListReviewsOptions = {},
  ): Promise<{ rows: ReviewWithMeta[]; total: number }> {
    const supabase = createSupabaseAdminClient();
    let q = supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (options.status) q = q.eq("status", options.status);
    if (options.productId) q = q.eq("product_id", options.productId);
    if (options.limit !== undefined) {
      const offset = options.offset ?? 0;
      q = q.range(offset, offset + options.limit - 1);
    }
    const { data, error, count } = await q;
    if (error) throw error;

    const rawRows = (data ?? []) as unknown as RawReview[];
    if (rawRows.length === 0) {
      return { rows: [], total: count ?? 0 };
    }

    const productIds = Array.from(new Set(rawRows.map((r) => r.product_id)));
    const userIds = Array.from(new Set(rawRows.map((r) => r.user_id)));

    const [{ data: prods }, { data: profs }] = await Promise.all([
      supabase
        .from("products")
        .select("id, slug, title")
        .in("id", productIds),
      supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds),
    ]);

    const prodById = new Map<string, RawProductLite>();
    for (const p of (prods ?? []) as unknown as RawProductLite[]) {
      prodById.set(p.id, p);
    }
    const profById = new Map<string, RawProfileLite>();
    for (const p of (profs ?? []) as unknown as RawProfileLite[]) {
      profById.set(p.id, p);
    }

    const locale = options.locale ?? "en";
    const rows: ReviewWithMeta[] = rawRows.map((raw) => {
      const base = toReview(raw);
      const prod = prodById.get(raw.product_id);
      const prof = profById.get(raw.user_id);
      const titleObj = (prod?.title as LocalizedField | null) ?? null;
      const productTitle = titleObj ? tField(titleObj, locale) || null : null;
      return {
        ...base,
        productSlug: prod?.slug ?? null,
        productTitle,
        reviewerEmail: prof?.email ?? null,
        reviewerName: prof?.display_name ?? null,
      };
    });

    return { rows, total: count ?? 0 };
  },

  async setStatus(id: string, status: ReviewStatus): Promise<Review> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toReview(data as unknown as RawReview);
  },

  async remove(id: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Recompute rating_avg and rating_count from approved reviews and write
   * them onto the products row. Called whenever a review crosses the
   * approved/not-approved boundary or is deleted.
   */
  async recomputeProductStats(productId: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");
    if (error) throw error;
    const ratings = ((data ?? []) as { rating: number }[]).map((r) => r.rating);
    const count = ratings.length;
    const avg =
      count === 0
        ? 0
        : Math.round((ratings.reduce((s, r) => s + r, 0) / count) * 100) / 100;
    const { error: upErr } = await supabase
      .from("products")
      .update({ rating_avg: avg, rating_count: count })
      .eq("id", productId);
    if (upErr) throw upErr;
  },

  /**
   * Did this user purchase the given product in any paid/fulfilled order?
   * Used to gate review submission.
   *
   * Implemented as two queries (avoiding fragile Supabase nested filter
   * syntax): pull the user's paid+fulfilled order ids, then check if any
   * order_items for this product reference one of them.
   */
  async userHasPurchased(
    userId: string,
    productId: string,
  ): Promise<{ purchased: boolean; orderId: string | null }> {
    const supabase = createSupabaseAdminClient();

    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["paid", "fulfilled"]);
    if (ordersErr) throw ordersErr;

    const orderIds = ((orders ?? []) as { id: string }[]).map((o) => o.id);
    if (orderIds.length === 0) return { purchased: false, orderId: null };

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("product_id", productId)
      .in("order_id", orderIds)
      .limit(1);
    if (itemsErr) throw itemsErr;

    const row = ((items ?? []) as { order_id: string }[])[0];
    return { purchased: Boolean(row), orderId: row?.order_id ?? null };
  },
};
