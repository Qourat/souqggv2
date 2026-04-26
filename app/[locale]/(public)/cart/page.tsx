import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="Cart"
      sprint="Sprint 2 — Checkout & Payments"
      body="Cart UI lands with the checkout flow."
    />
  );
}
