import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SprintStub title="Orders" sprint="Sprint 2 — Checkout & Payments" />;
}
