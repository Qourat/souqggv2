import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="Your library"
      sprint="Sprint 3 — Library & Delivery"
      body="Buyer-only signed-URL downloads land here."
    />
  );
}
