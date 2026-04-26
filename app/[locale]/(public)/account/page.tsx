import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="Account"
      sprint="Sprint 3 — Library & Delivery"
      body="Profile, addresses, and order history land with the buyer flow."
    />
  );
}
