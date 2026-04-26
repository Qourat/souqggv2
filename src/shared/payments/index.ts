import { stripeAdapter } from "./stripe";

import type { PaymentProviderAdapter } from "./types";

/**
 * Active payment provider — currently Stripe. The adapter interface is
 * designed so a MENA fallback (PayTabs / Telr / Checkout.com) can plug in
 * without touching call sites.
 */
export const payments: PaymentProviderAdapter = stripeAdapter;

export type {
  PaymentProviderAdapter,
  CheckoutSession,
  CreateCheckoutInput,
  NormalizedPaymentEvent,
  NormalizedPaymentEventType,
} from "./types";
