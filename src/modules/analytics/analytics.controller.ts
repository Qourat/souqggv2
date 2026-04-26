import "server-only";

import { analyticsService } from "./analytics.service";
import type { DashboardSummary } from "./analytics.types";

export const analyticsController = {
  async dashboardSummary(): Promise<DashboardSummary> {
    const r = await analyticsService.dashboardSummary();
    if (!r.ok) throw r.error;
    return r.value;
  },
};
