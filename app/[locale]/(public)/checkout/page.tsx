import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="Checkout"
      sprint="Sprint 2 — Checkout & Payments"
      body="Stripe checkout session + MENA fallback land here."
    />
  );
}
