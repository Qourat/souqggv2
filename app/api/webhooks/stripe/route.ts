import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/core/logger";
import { ordersService } from "@/modules/orders";
import { payments } from "@/shared/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("webhook.stripe");

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const body = await req.text();

  let event;
  try {
    event = await payments.verifyWebhook(body, signature);
  } catch (e) {
    log.error("invalid webhook", { e: String(e) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  log.info("event", { type: event.type, orderId: event.orderId });

  try {
    if (event.type === "checkout.completed" && event.orderId) {
      const r = await ordersService.fulfilCheckoutCompleted(
        event.orderId,
        event.paymentIntentId,
      );
      if (!r.ok) {
        log.error("fulfilment failed", {
          code: r.error.code,
          message: r.error.message,
        });
        return NextResponse.json({ error: r.error.message }, { status: 500 });
      }
    } else if (event.type === "payment.failed" && event.orderId) {
      await ordersService.failOrder(event.orderId);
    }
  } catch (e) {
    log.error("webhook handler crashed", { e: String(e) });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
