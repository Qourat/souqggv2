import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";

import type {
  DashboardRecentOrder,
  DashboardTopProduct,
} from "./analytics.types";

/**
 * Analytics repository.
 *
 * Hard rules:
 *   - Read-only. The dashboard never writes.
 *   - All queries go through the admin client because they aggregate
 *     across users; RLS would hide rows we need.
 *   - Each method returns a small, already-shaped value so the service
 *     layer can compose without re-walking large arrays.
 *   - "Paid" for revenue purposes means status in (paid, fulfilled).
 */

const PAID_STATUSES = ["paid", "fulfilled"] as const;

interface RawOrderRow {
  id: string;
  status: DashboardRecentOrder["status"];
  total_cents: number;
  currency: string;
  email: string | null;
  created_at: string;
}

export const analyticsRepository = {
  async sumPaidSince(sinceIso: string): Promise<{
    cents: number;
    currency: string | null;
    count: number;
  }> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("total_cents, currency")
      .in("status", PAID_STATUSES as unknown as string[])
      .gte("paid_at", sinceIso);
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      total_cents: number;
      currency: string;
    }>;
    if (rows.length === 0) return { cents: 0, currency: null, count: 0 };

    const byCurrency = new Map<string, number>();
    for (const r of rows) {
      byCurrency.set(
        r.currency,
        (byCurrency.get(r.currency) ?? 0) + r.total_cents,
      );
    }
    let topCurrency: string | null = null;
    let topCents = 0;
    for (const [cur, cents] of byCurrency.entries()) {
      if (cents > topCents) {
        topCents = cents;
        topCurrency = cur;
      }
    }
    return { cents: topCents, currency: topCurrency, count: rows.length };
  },

  async countOrdersByStatusSince(
    statuses: ReadonlyArray<DashboardRecentOrder["status"]>,
    sinceIso?: string,
  ): Promise<number> {
    const supabase = createSupabaseAdminClient();
    let q = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", statuses as unknown as string[]);
    if (sinceIso) q = q.gte("created_at", sinceIso);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  },

  async countProductsByStatus(
    status: "draft" | "published" | "archived",
  ): Promise<number> {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  },

  async topProductSince(
    sinceIso: string,
  ): Promise<DashboardTopProduct | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_items")
      .select(
        "product_id, quantity, unit_price_cents, title_snapshot, orders!inner(currency, status, paid_at)",
      )
      .in("orders.status", PAID_STATUSES as unknown as string[])
      .gte("orders.paid_at", sinceIso)
      .limit(2000);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<{
      product_id: string;
      quantity: number;
      unit_price_cents: number;
      title_snapshot: Record<string, string> | null;
      orders: { currency: string };
    }>;
    if (rows.length === 0) return null;

    const acc = new Map<
      string,
      {
        productId: string;
        units: number;
        revenue: number;
        currency: string;
        title: Record<string, string> | null;
      }
    >();
    for (const r of rows) {
      const cur = acc.get(r.product_id);
      if (cur) {
        cur.units += r.quantity;
        cur.revenue += r.quantity * r.unit_price_cents;
      } else {
        acc.set(r.product_id, {
          productId: r.product_id,
          units: r.quantity,
          revenue: r.quantity * r.unit_price_cents,
          currency: r.orders.currency,
          title: r.title_snapshot,
        });
      }
    }
    let best: ReturnType<typeof acc.get> = undefined;
    for (const v of acc.values()) {
      if (!best || v.units > best.units) best = v;
    }
    if (!best) return null;
    return {
      productId: best.productId,
      title:
        (best.title?.en as string) ||
        (best.title?.ar as string) ||
        best.productId,
      unitsSold: best.units,
      revenueCents: best.revenue,
      currency: best.currency,
    };
  },

  async recentOrders(limit: number): Promise<DashboardRecentOrder[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, total_cents, currency, email, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as unknown as RawOrderRow[]).map((r) => ({
      id: r.id,
      status: r.status,
      email: r.email,
      totalCents: r.total_cents,
      currency: r.currency,
      createdAt: r.created_at,
    }));
  },
};
