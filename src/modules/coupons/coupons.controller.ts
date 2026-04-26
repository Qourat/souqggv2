import "server-only";

import { couponsService } from "./coupons.service";
import type { Coupon } from "./coupons.types";

export const couponsController = {
  async listAll(): Promise<Coupon[]> {
    const r = await couponsService.listAll();
    if (!r.ok) throw r.error;
    return r.value;
  },

  async getById(id: string): Promise<Coupon | null> {
    const r = await couponsService.getById(id);
    if (!r.ok) throw r.error;
    return r.value;
  },
};
