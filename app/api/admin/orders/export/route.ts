import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/core/logger";
import { hasSupabase } from "@/shared/db/has-supabase";
import { requireAdmin } from "@/shared/auth/session";
import { ordersRepository } from "@/modules/orders/orders.repository";
import { auditService } from "@/modules/audit";
import type { Order, OrderItem } from "@/modules/orders/orders.types";

type OrderStatus = Order["status"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("api.admin.orders.export");

const ALLOWED_STATUS = new Set<OrderStatus>([
  "pending",
  "paid",
  "fulfilled",
  "failed",
  "refunded",
  "cancelled",
]);

const HEADER = [
  "id",
  "created_at",
  "status",
  "email",
  "currency",
  "subtotal_cents",
  "discount_cents",
  "total_cents",
  "items_count",
  "items_summary",
  "payment_provider",
  "payment_intent_id",
  "paid_at",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function summarizeItems(items: OrderItem[]): string {
  return items
    .map((it) => {
      const title =
        Object.values(it.titleSnapshot ?? {})[0] ?? it.productId.slice(0, 8);
      return `${it.quantity}× ${title}`;
    })
    .join(" | ");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && ALLOWED_STATUS.has(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  const PAGE = 500;
  const all: Array<{
    id: string;
    createdAt: Date;
    status: OrderStatus;
    email: string | null;
    currency: string;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    itemsCount: number;
    itemsSummary: string;
    paymentProvider: string | null;
    paymentIntentId: string | null;
    paidAt: Date | null;
  }> = [];

  let offset = 0;
  let safety = 0;
  while (safety++ < 200) {
    const { rows, total } = await ordersRepository.listAllForAdmin({
      status,
      limit: PAGE,
      offset,
    });
    for (const r of rows) {
      all.push({
        id: r.order.id,
        createdAt: r.order.createdAt,
        status: r.order.status,
        email: r.order.email,
        currency: r.order.currency,
        subtotalCents: r.order.subtotalCents,
        discountCents: r.order.discountCents,
        totalCents: r.order.totalCents,
        itemsCount: r.items.length,
        itemsSummary: summarizeItems(r.items),
        paymentProvider: r.order.paymentProvider ?? null,
        paymentIntentId: r.order.paymentIntentId ?? null,
        paidAt: r.order.paidAt,
      });
    }
    offset += rows.length;
    if (offset >= total || rows.length === 0) break;
  }

  await auditService.log({
    actorId: null,
    action: "orders.export",
    entityType: "order",
    diff: { status: status ?? "all", rows: all.length },
  });

  const lines: string[] = [HEADER.join(",")];
  for (const r of all) {
    lines.push(
      [
        r.id,
        r.createdAt.toISOString(),
        r.status,
        r.email ?? "",
        r.currency,
        r.subtotalCents,
        r.discountCents,
        r.totalCents,
        r.itemsCount,
        r.itemsSummary,
        r.paymentProvider ?? "",
        r.paymentIntentId ?? "",
        r.paidAt ? r.paidAt.toISOString() : "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const body = lines.join("\n") + "\n";
  log.info("export", { status: status ?? "all", rows: all.length });

  const filename = `orders-${status ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
