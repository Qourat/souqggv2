import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";
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

interface RawOrder {
  id: string;
  user_id: string | null;
  status: Order["status"];
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  payment_provider: Order["paymentProvider"];
  payment_intent_id: string | null;
  coupon_id: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

interface RawOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  title_snapshot: Record<string, string>;
  unit_price_cents: number;
  quantity: number;
  created_at: string;
}

function toOrder(r: RawOrder): Order {
  return {
    id: r.id,
    userId: r.user_id,
    status: r.status,
    subtotalCents: r.subtotal_cents,
    discountCents: r.discount_cents,
    totalCents: r.total_cents,
    currency: r.currency,
    paymentProvider: r.payment_provider,
    paymentIntentId: r.payment_intent_id,
    couponId: r.coupon_id,
    email: r.email,
    metadata: r.metadata,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    paidAt: r.paid_at ? new Date(r.paid_at) : null,
  } as Order;
}

function toItem(r: RawOrderItem): OrderItem {
  return {
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    titleSnapshot: r.title_snapshot,
    unitPriceCents: r.unit_price_cents,
    quantity: r.quantity,
    createdAt: new Date(r.created_at),
  } as OrderItem;
}

export const ordersRepository = {
  async create(input: CreateOrderInput): Promise<OrderWithItems> {
    const supabase = createSupabaseAdminClient();
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
    const orderRow = toOrder(order as unknown as RawOrder);

    const itemsPayload = input.items.map((it) => ({
      order_id: orderRow.id,
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
      order: orderRow,
      items: ((items ?? []) as unknown as RawOrderItem[]).map(toItem),
    };
  },

  async setPaymentIntent(
    orderId: string,
    paymentIntentId: string | null,
  ): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("orders")
      .update({ payment_intent_id: paymentIntentId })
      .eq("id", orderId);
    if (error) throw error;
  },

  async markPaidByOrderId(orderId: string): Promise<Order | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("*")
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toOrder(data as unknown as RawOrder) : null;
  },

  async markFailedByOrderId(orderId: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    if (error) throw error;
  },

  async findById(id: string): Promise<OrderWithItems | null> {
    const supabase = createSupabaseAdminClient();
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
      order: toOrder(order as unknown as RawOrder),
      items: ((items ?? []) as unknown as RawOrderItem[]).map(toItem),
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

    const rawOrders = orders as unknown as RawOrder[];
    const orderIds = rawOrders.map((o) => o.id);
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    if (itemsErr) throw itemsErr;

    const byOrder = new Map<string, OrderItem[]>();
    for (const it of (items ?? []) as unknown as RawOrderItem[]) {
      const norm = toItem(it);
      const list = byOrder.get(norm.orderId) ?? [];
      list.push(norm);
      byOrder.set(norm.orderId, list);
    }
    return rawOrders.map((o) => ({
      order: toOrder(o),
      items: byOrder.get(o.id) ?? [],
    }));
  },

  async listAllForAdmin(options: {
    status?: Order["status"];
    limit?: number;
    offset?: number;
  } = {}): Promise<{ rows: OrderWithItems[]; total: number }> {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (options.status) query = query.eq("status", options.status);
    if (options.limit !== undefined) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + options.limit - 1);
    }
    const { data: orders, error, count } = await query;
    if (error) throw error;
    if (!orders || orders.length === 0) return { rows: [], total: count ?? 0 };

    const rawOrders = orders as unknown as RawOrder[];
    const orderIds = rawOrders.map((o) => o.id);
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    if (itemsErr) throw itemsErr;

    const byOrder = new Map<string, OrderItem[]>();
    for (const it of (items ?? []) as unknown as RawOrderItem[]) {
      const norm = toItem(it);
      const list = byOrder.get(norm.orderId) ?? [];
      list.push(norm);
      byOrder.set(norm.orderId, list);
    }
    return {
      rows: rawOrders.map((o) => ({
        order: toOrder(o),
        items: byOrder.get(o.id) ?? [],
      })),
      total: count ?? rawOrders.length,
    };
  },
};
