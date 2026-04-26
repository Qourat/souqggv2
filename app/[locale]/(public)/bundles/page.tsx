import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function BundlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="Bundles"
      sprint="Sprint 4 — Merchandising"
      body="Curated multi-product bundles with anchor pricing land here."
    />
  );
}
