import { setRequestLocale } from "next-intl/server";

import { SprintStub } from "@/components/layout/sprint-stub";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="Products"
      sprint="Sprint 2 — Admin Catalogue"
      body="CRUD, file upload, multi-locale title editor land here."
    />
  );
}
