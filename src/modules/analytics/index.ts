/**
 * Analytics module — Sprint 5.
 *
 * Read-only aggregations for the admin dashboard. No mutations live
 * here on purpose — every "analytics" write is the side effect of
 * another module (orders, downloads, ...) so we never double-count.
 */

export { analyticsController } from "./analytics.controller";
export { analyticsService } from "./analytics.service";
export type {
  DashboardSummary,
  DashboardKpi,
  DashboardTopProduct,
  DashboardRecentOrder,
} from "./analytics.types";
