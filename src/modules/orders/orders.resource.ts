import { tField, type LocalizedField } from "@/shared/i18n/localized-field";

import type { Order, OrderItem, OrderWithItems } from "./orders.types";

export interface OrderItemDto {
  id: string;
  productId: string;
  title: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderDto {
  id: string;
  userId: string | null;
  status: Order["status"];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  email: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItemDto[];
}

export function toOrderItemDto(item: OrderItem, locale: string): OrderItemDto {
  return {
    id: item.id,
    productId: item.productId,
    title: tField(item.titleSnapshot as LocalizedField | null, locale),
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    lineTotalCents: item.unitPriceCents * item.quantity,
  };
}

export function toOrderDto(row: OrderWithItems, locale: string): OrderDto {
  return {
    id: row.order.id,
    userId: row.order.userId,
    status: row.order.status,
    subtotalCents: row.order.subtotalCents,
    discountCents: row.order.discountCents,
    totalCents: row.order.totalCents,
    currency: row.order.currency,
    email: row.order.email,
    paidAt: row.order.paidAt
      ? new Date(row.order.paidAt).toISOString()
      : null,
    createdAt: new Date(row.order.createdAt).toISOString(),
    items: row.items.map((it) => toOrderItemDto(it, locale)),
  };
}
