export interface CreateCheckoutInput {
  orderId: string;
  amountCents: number;
  currency: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    unitAmountCents: number;
  }>;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export type NormalizedPaymentEventType =
  | "checkout.completed"
  | "payment.failed"
  | "payment.refunded";

export interface NormalizedPaymentEvent {
  id: string;
  type: NormalizedPaymentEventType;
  orderId?: string;
  paymentIntentId?: string;
  amountCents?: number;
  currency?: string;
  raw: unknown;
}

export interface PaymentProviderAdapter {
  id: "stripe" | "paytabs" | "telr" | "checkout" | "manual";
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
  verifyWebhook(rawBody: string, signature: string): Promise<NormalizedPaymentEvent>;
}
