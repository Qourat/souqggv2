import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";

import type { Coupon } from "./coupons.types";
import type { UpsertCouponInput } from "./coupons.schema";

interface RawCoupon {
  id: string;
  code: string;
  discount_type: Coupon["discountType"];
  discount_value: number;
  min_order_cents: number;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function toCoupon(r: RawCoupon): Coupon {
  return {
    id: r.id,
    code: r.code,
    discountType: r.discount_type,
    discountValue: r.discount_value,
    minOrderCents: r.min_order_cents,
    usageLimit: r.usage_limit,
    usedCount: r.used_count,
    startsAt: r.starts_at ? new Date(r.starts_at) : null,
    expiresAt: r.expires_at ? new Date(r.expires_at) : null,
    isActive: r.is_active,
    createdAt: new Date(r.created_at),
  } as Coupon;
}

export const couponsRepository = {
  async listAll(): Promise<Coupon[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as RawCoupon[]).map(toCoupon);
  },

  async findById(id: string): Promise<Coupon | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toCoupon(data as unknown as RawCoupon) : null;
  },

  async findByCode(code: string): Promise<Coupon | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", code)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toCoupon(data as unknown as RawCoupon) : null;
  },

  async upsert(input: UpsertCouponInput): Promise<Coupon> {
    const supabase = createSupabaseAdminClient();
    const payload = {
      code: input.code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_cents: input.minOrderCents,
      usage_limit: input.usageLimit,
      starts_at: input.startsAt?.toISOString() ?? null,
      expires_at: input.expiresAt?.toISOString() ?? null,
      is_active: input.isActive,
    };
    if (input.id) {
      const { data, error } = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .single();
      if (error) throw error;
      return toCoupon(data as unknown as RawCoupon);
    }
    const { data, error } = await supabase
      .from("coupons")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return toCoupon(data as unknown as RawCoupon);
  },

  async remove(id: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw error;
  },

  async incrementUsed(id: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { data: row, error: selErr } = await supabase
      .from("coupons")
      .select("used_count")
      .eq("id", id)
      .single();
    if (selErr) throw selErr;
    const next =
      ((row as { used_count: number } | null)?.used_count ?? 0) + 1;
    const { error } = await supabase
      .from("coupons")
      .update({ used_count: next })
      .eq("id", id);
    if (error) throw error;
  },
};
