import "server-only";

import { getLocale } from "next-intl/server";

import { ordersService } from "./orders.service";
import type { OrderDto } from "./orders.resource";

export const ordersController = {
  async getById(id: string): Promise<OrderDto | null> {
    const locale = await getLocale();
    const r = await ordersService.getById(id, locale);
    if (!r.ok) {
      if (r.error.code === "NOT_FOUND") return null;
      throw r.error;
    }
    return r.value;
  },

  async listAllForAdmin(options: {
    status?:
      | "pending"
      | "paid"
      | "fulfilled"
      | "failed"
      | "refunded"
      | "cancelled";
    limit?: number;
    offset?: number;
  }): Promise<{ rows: OrderDto[]; total: number }> {
    const locale = await getLocale();
    const r = await ordersService.listAllForAdmin(options, locale);
    if (!r.ok) throw r.error;
    return r.value;
  },
};
