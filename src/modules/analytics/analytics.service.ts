import "server-only";

import { AppError, ok, tryAsync, type Result } from "@/core";
import { logger } from "@/core/logger";
import { hasSupabase } from "@/shared/db/has-supabase";

import { analyticsRepository } from "./analytics.repository";
import type { DashboardSummary } from "./analytics.types";

const log = logger("analytics.service");

/**
 * Analytics service.
 *
 * Computes the admin dashboard summary in a single call. Each
 * sub-query is wrapped so a single failure (e.g. missing table
 * permission) does NOT take the whole dashboard down — we degrade
 * gracefully to zeros for that card and keep going.
 */

function startOfMonthIso(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return d.toISOString();
}

function thirtyDaysAgoIso(): string {
  const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export const analyticsService = {
  async dashboardSummary(): Promise<Result<DashboardSummary>> {
    if (!hasSupabase()) {
      return ok({
        revenueMtdCents: 0,
        revenueMtdCurrency: "USD",
        ordersMtd: 0,
        pendingOrders: 0,
        failedMtd: 0,
        publishedProducts: 0,
        draftProducts: 0,
        topProduct: null,
        recentOrders: [],
        generatedAt: new Date().toISOString(),
      });
    }

    const startOfMonth = startOfMonthIso();
    const last30 = thirtyDaysAgoIso();

    const [
      revenue,
      ordersMtd,
      pending,
      failed,
      published,
      draft,
      topProduct,
      recentOrders,
    ] = await Promise.all([
      tryAsync(
        () => analyticsRepository.sumPaidSince(startOfMonth),
        AppError.fromUnknown,
      ),
      tryAsync(
        () =>
          analyticsRepository.countOrdersByStatusSince(
            ["paid", "fulfilled"],
            startOfMonth,
          ),
        AppError.fromUnknown,
      ),
      tryAsync(
        () => analyticsRepository.countOrdersByStatusSince(["pending"]),
        AppError.fromUnknown,
      ),
      tryAsync(
        () =>
          analyticsRepository.countOrdersByStatusSince(
            ["failed"],
            startOfMonth,
          ),
        AppError.fromUnknown,
      ),
      tryAsync(
        () => analyticsRepository.countProductsByStatus("published"),
        AppError.fromUnknown,
      ),
      tryAsync(
        () => analyticsRepository.countProductsByStatus("draft"),
        AppError.fromUnknown,
      ),
      tryAsync(
        () => analyticsRepository.topProductSince(last30),
        AppError.fromUnknown,
      ),
      tryAsync(() => analyticsRepository.recentOrders(8), AppError.fromUnknown),
    ]);

    function unwrap<T>(r: Result<T>, label: string, fallback: T): T {
      if (r.ok) return r.value;
      log.warn("dashboard sub-query failed", { label, error: r.error.message });
      return fallback;
    }

    const revenueValue = unwrap(revenue, "revenue", {
      cents: 0,
      currency: null as string | null,
      count: 0,
    });

    return ok({
      revenueMtdCents: revenueValue.cents,
      revenueMtdCurrency: revenueValue.currency ?? "USD",
      ordersMtd: unwrap(ordersMtd, "ordersMtd", 0),
      pendingOrders: unwrap(pending, "pending", 0),
      failedMtd: unwrap(failed, "failed", 0),
      publishedProducts: unwrap(published, "published", 0),
      draftProducts: unwrap(draft, "draft", 0),
      topProduct: unwrap(topProduct, "topProduct", null),
      recentOrders: unwrap(recentOrders, "recentOrders", []),
      generatedAt: new Date().toISOString(),
    });
  },
};
