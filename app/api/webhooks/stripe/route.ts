import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/core/logger";
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
  try {
    const event = await payments.verifyWebhook(body, signature);
    log.info("event", { type: event.type, orderId: event.orderId });
    // Sprint 2: orders module will fulfil the order based on event.type.
    return NextResponse.json({ received: true });
  } catch (e) {
    log.error("invalid webhook", { e: String(e) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
