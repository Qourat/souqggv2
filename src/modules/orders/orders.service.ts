import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";
import { logger } from "@/core/logger";
import { hasSupabase } from "@/shared/db/has-supabase";
import { publicEnv } from "@/shared/env";
import { payments } from "@/shared/payments";
import { tField, type LocalizedField } from "@/shared/i18n/localized-field";

import { auditService } from "@/modules/audit";
import { couponsService } from "@/modules/coupons/coupons.service";
import { couponsRepository } from "@/modules/coupons/coupons.repository";
import { downloadsService } from "@/modules/downloads/downloads.service";
import { notificationsService } from "@/modules/notifications/notifications.service";
import { productsRepository } from "@/modules/products/products.repository";

import { createCheckoutSchema } from "./orders.schema";
import { ordersRepository } from "./orders.repository";
import { toOrderDto, type OrderDto } from "./orders.resource";
import type { Order } from "./orders.types";

const log = logger("orders.service");

/**
 * Orders / checkout service.
 *
 * Hard rules:
 *   - Prices come from the DB, never from the cart payload. The client can
 *     send any quantity but never any price.
 *   - All amounts are in integer cents in the product's own currency.
 *   - The order row is created in `pending` status BEFORE the payment URL
 *     is returned. The webhook flips it to `paid` and creates download rows.
 *   - Demo / no-DB mode short-circuits with a friendly message instead of
 *     pretending to charge a card.
 */

export interface CreateCheckoutOk {
  orderId: string;
  url: string;
  totalCents: number;
  currency: string;
}

export const ordersService = {
  async createCheckout(
    rawInput: unknown,
  ): Promise<Result<CreateCheckoutOk>> {
    const parsed = createCheckoutSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid checkout", parsed.error.format()));
    }
    const input = parsed.data;

    if (!hasSupabase()) {
      return err(
        AppError.dependencyDown(
          "Checkout is disabled in demo mode. Configure Supabase + Stripe to enable orders.",
        ),
      );
    }

    const productIds = input.lines.map((l) => l.productId);
    const products = await tryAsync(
      () => productsRepository.findManyByIds(productIds),
      AppError.fromUnknown,
    );
    if (!products.ok) return products;

    const byId = new Map(products.value.map((p) => [p.id, p]));
    const missing = productIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      return err(AppError.notFound(`product(s): ${missing.join(", ")}`));
    }

    let currency: string | null = null;
    let subtotalCents = 0;
    const items: Array<{
      productId: string;
      titleSnapshot: Record<string, string>;
      unitPriceCents: number;
      quantity: number;
    }> = [];

    for (const line of input.lines) {
      const product = byId.get(line.productId)!;
      if (product.status !== "published") {
        return err(AppError.validation(`Product not for sale: ${product.slug}`));
      }
      currency ??= product.currency;
      if (currency !== product.currency) {
        return err(
          AppError.validation(
            "Cart contains mixed currencies; please split your order.",
          ),
        );
      }
      subtotalCents += product.priceCents * line.quantity;
      items.push({
        productId: product.id,
        titleSnapshot: (product.title ?? {}) as Record<string, string>,
        unitPriceCents: product.priceCents,
        quantity: line.quantity,
      });
    }

    if (!currency) {
      return err(AppError.validation("Empty cart"));
    }

    let discountCents = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const applied = await couponsService.applyToCart({
        code: input.couponCode,
        subtotalCents,
        currency,
      });
      if (!applied.ok) return applied;
      discountCents = applied.value.discountCents;
      couponId = applied.value.coupon.id;
      couponCode = applied.value.coupon.code;
    }
    const totalCents = Math.max(0, subtotalCents - discountCents);

    const created = await tryAsync(
      () =>
        ordersRepository.create({
          userId: null,
          email: input.email,
          status: "pending",
          subtotalCents,
          discountCents,
          totalCents,
          currency,
          paymentProvider: "stripe",
          couponId,
          metadata: {
            locale: input.locale,
            ...(couponCode ? { couponCode } : {}),
          },
          items,
        }),
      AppError.fromUnknown,
    );
    if (!created.ok) return created;

    if (totalCents === 0) {
      const paid = await tryAsync(
        () => ordersRepository.markPaidByOrderId(created.value.order.id),
        AppError.fromUnknown,
      );
      if (!paid.ok) return paid;
      const url = `${publicEnv.appUrl}/${input.locale}/thank-you?orderId=${created.value.order.id}`;
      return ok({
        orderId: created.value.order.id,
        url,
        totalCents,
        currency,
      });
    }

    const session = await tryAsync(
      () =>
        payments.createCheckoutSession({
          orderId: created.value.order.id,
          amountCents: totalCents,
          currency,
          email: input.email,
          successUrl: `${publicEnv.appUrl}/${input.locale}/thank-you?orderId=${created.value.order.id}&session={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${publicEnv.appUrl}/${input.locale}/cart`,
          lineItems: items.map((it) => ({
            name: tField(it.titleSnapshot as LocalizedField, input.locale),
            quantity: it.quantity,
            unitAmountCents: it.unitPriceCents,
          })),
          metadata: { orderId: created.value.order.id },
        }),
      AppError.fromUnknown,
    );
    if (!session.ok) return session;

    return ok({
      orderId: created.value.order.id,
      url: session.value.url,
      totalCents,
      currency,
    });
  },

  async getById(id: string, locale: string): Promise<Result<OrderDto>> {
    if (!id) return err(AppError.validation("Id required"));
    if (!hasSupabase()) {
      return err(AppError.notFound("Order"));
    }
    const r = await tryAsync(
      () => ordersRepository.findById(id),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    if (!r.value) return err(AppError.notFound("Order"));
    return ok(toOrderDto(r.value, locale));
  },

  async getByIdForUser(
    id: string,
    userId: string,
    locale: string,
  ): Promise<Result<OrderDto>> {
    const r = await this.getById(id, locale);
    if (!r.ok) return r;
    if (r.value.userId !== userId) {
      return err(AppError.notFound("Order"));
    }
    return r;
  },

  async listAllForAdmin(
    options: {
      status?: Order["status"];
      limit?: number;
      offset?: number;
    },
    locale: string,
  ): Promise<Result<{ rows: OrderDto[]; total: number }>> {
    if (!hasSupabase()) return ok({ rows: [], total: 0 });
    const r = await tryAsync(
      () => ordersRepository.listAllForAdmin(options),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok({
      rows: r.value.rows.map((row) => toOrderDto(row, locale)),
      total: r.value.total,
    });
  },

  async fulfilCheckoutCompleted(
    orderId: string,
    paymentIntentId?: string,
  ): Promise<Result<true>> {
    if (!orderId) return err(AppError.validation("orderId required"));
    if (paymentIntentId) {
      const linked = await tryAsync(
        () => ordersRepository.setPaymentIntent(orderId, paymentIntentId),
        AppError.fromUnknown,
      );
      if (!linked.ok) return linked;
    }
    const paid = await tryAsync(
      () => ordersRepository.markPaidByOrderId(orderId),
      AppError.fromUnknown,
    );
    if (!paid.ok) return paid;

    const full = await tryAsync(
      () => ordersRepository.findById(orderId),
      AppError.fromUnknown,
    );
    if (!full.ok || !full.value) {
      log.warn("order vanished after mark-paid", { orderId });
      return ok(true);
    }

    if (full.value.order.couponId) {
      await tryAsync(
        () => couponsRepository.incrementUsed(full.value!.order.couponId!),
        AppError.fromUnknown,
      );
    }

    const fulfilment = await downloadsService.fulfilOrder({
      orderId,
      userId: full.value.order.userId ?? null,
      items: full.value.items.map((it) => ({
        orderItemId: it.id,
        productId: it.productId,
      })),
    });
    if (!fulfilment.ok) {
      // Don't fail the webhook; downloads can be re-fulfilled. Just log.
      log.error("download fulfilment failed", {
        orderId,
        code: fulfilment.error.code,
        message: fulfilment.error.message,
      });
    }

    await auditService.log({
      actorId: full.value.order.userId,
      action: "order.paid",
      entityType: "order",
      entityId: orderId,
      diff: {
        totalCents: full.value.order.totalCents,
        currency: full.value.order.currency,
        items: full.value.items.length,
        downloadsCreated: fulfilment.ok ? fulfilment.value.created : 0,
        paymentIntentId: paymentIntentId ?? null,
      },
    });

    // Best-effort "your downloads are ready" email. Failures here MUST
    // never roll back the paid status — the buyer can always re-fetch
    // from /library.
    const recipient =
      full.value.order.email ??
      (typeof full.value.order.metadata === "object" &&
      full.value.order.metadata &&
      "email" in full.value.order.metadata
        ? (full.value.order.metadata as { email?: string }).email
        : null) ??
      null;
    if (recipient) {
      const meta =
        (full.value.order.metadata as { locale?: string } | null) ?? null;
      const locale = meta?.locale ?? "en";
      const items = await downloadsService.listForOrder(orderId, locale);
      if (items.ok && items.value.length > 0) {
        await notificationsService.sendDownloadReady({
          to: recipient,
          locale,
          orderId,
          totalCents: full.value.order.totalCents,
          currency: full.value.order.currency,
          items: items.value.map((it) => ({
            productTitle: it.productTitle,
            filename: it.filename,
            downloadUrl: `${publicEnv.appUrl}/api/downloads/${it.downloadId}`,
          })),
        });
      } else if (!items.ok) {
        log.warn("download-ready email skipped: cannot list downloads", {
          orderId,
          error: items.error.message,
        });
      }
    } else {
      log.info("download-ready email skipped: no recipient", { orderId });
    }
    return ok(true);
  },

  async failOrder(orderId: string): Promise<Result<true>> {
    if (!orderId) return err(AppError.validation("orderId required"));
    const r = await tryAsync(
      () => ordersRepository.markFailedByOrderId(orderId),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(true);
  },
};
