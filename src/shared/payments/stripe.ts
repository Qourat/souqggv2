import "server-only";

import Stripe from "stripe";

import { env } from "@/shared/env";

import type {
  CheckoutSession,
  CreateCheckoutInput,
  NormalizedPaymentEvent,
  PaymentProviderAdapter,
} from "./types";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export const stripeAdapter: PaymentProviderAdapter = {
  id: "stripe",

  async createCheckoutSession({
    orderId,
    currency,
    email,
    successUrl,
    cancelUrl,
    lineItems,
    metadata,
  }: CreateCheckoutInput): Promise<CheckoutSession> {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems.map((li) => ({
        quantity: li.quantity,
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: li.name },
          unit_amount: li.unitAmountCents,
        },
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: { orderId, ...(metadata ?? {}) },
    });

    return { id: session.id, url: session.url ?? cancelUrl };
  },

  async verifyWebhook(
    rawBody: string,
    signature: string,
  ): Promise<NormalizedPaymentEvent> {
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    const event = getStripe().webhooks.constructEvent(rawBody, signature, secret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          id: event.id,
          type: "checkout.completed",
          orderId: session.metadata?.orderId,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          amountCents: session.amount_total ?? undefined,
          currency: session.currency ?? undefined,
          raw: event,
        };
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          id: event.id,
          type: "payment.failed",
          orderId: intent.metadata?.orderId,
          paymentIntentId: intent.id,
          amountCents: intent.amount,
          currency: intent.currency,
          raw: event,
        };
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        return {
          id: event.id,
          type: "payment.refunded",
          paymentIntentId:
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : (charge.payment_intent?.id ?? undefined),
          amountCents: charge.amount_refunded,
          currency: charge.currency,
          raw: event,
        };
      }
      default:
        return {
          id: event.id,
          type: "checkout.completed",
          raw: event,
        };
    }
  },
};
