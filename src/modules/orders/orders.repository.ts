import "server-only";

import { createSupabaseServerClient } from "@/shared/db/supabase/server";

import type { Order, OrderItem, OrderWithItems } from "./orders.types";

export interface CreateOrderInput {
  userId: string | null;
  email: string | null;
  status: Order["status"];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  paymentProvider: Order["paymentProvider"];
  metadata?: Record<string, unknown>;
  items: Array<{
    productId: string;
    titleSnapshot: Record<string, string>;
    unitPriceCents: number;
    quantity: number;
  }>;
}

export const ordersRepository = {
  async create(input: CreateOrderInput): Promise<OrderWithItems> {
    const supabase = await createSupabaseServerClient();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: input.userId,
        email: input.email,
        status: input.status,
        subtotal_cents: input.subtotalCents,
        discount_cents: input.discountCents,
        total_cents: input.totalCents,
        currency: input.currency,
        payment_provider: input.paymentProvider,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();
    if (orderErr) throw orderErr;

    const itemsPayload = input.items.map((it) => ({
      order_id: (order as Order).id,
      product_id: it.productId,
      title_snapshot: it.titleSnapshot,
      unit_price_cents: it.unitPriceCents,
      quantity: it.quantity,
    }));
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .insert(itemsPayload)
      .select("*");
    if (itemsErr) throw itemsErr;

    return {
      order: order as unknown as Order,
      items: (items ?? []) as unknown as OrderItem[],
    };
  },

  async setPaymentIntent(
    orderId: string,
    paymentIntentId: string | null,
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("orders")
      .update({ payment_intent_id: paymentIntentId })
      .eq("id", orderId);
    if (error) throw error;
  },

  async markPaidByOrderId(orderId: string): Promise<Order | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("*")
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as Order) ?? null;
  },

  async markFailedByOrderId(orderId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    if (error) throw error;
  },

  async findById(id: string): Promise<OrderWithItems | null> {
    const supabase = await createSupabaseServerClient();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (orderErr && orderErr.code !== "PGRST116") throw orderErr;
    if (!order) return null;
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true });
    if (itemsErr) throw itemsErr;
    return {
      order: order as unknown as Order,
      items: (items ?? []) as unknown as OrderItem[],
    };
  },

  async listForUser(userId: string): Promise<OrderWithItems[]> {
    const supabase = await createSupabaseServerClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!orders || orders.length === 0) return [];

    const orderIds = (orders as Order[]).map((o) => o.id);
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    if (itemsErr) throw itemsErr;

    const byOrder = new Map<string, OrderItem[]>();
    for (const it of (items ?? []) as OrderItem[]) {
      const list = byOrder.get(it.orderId) ?? [];
      list.push(it);
      byOrder.set(it.orderId, list);
    }
    return (orders as Order[]).map((o) => ({
      order: o,
      items: byOrder.get(o.id) ?? [],
    }));
  },
};
