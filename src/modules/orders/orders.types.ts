import type { OrderRow, OrderItemRow } from "@/shared/db/schema";

export type Order = OrderRow;
export type OrderItem = OrderItemRow;

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}
