import { setRequestLocale } from "next-intl/server";

import { PolicyShell } from "@/components/layout/policy-shell";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PolicyShell title="Terms of service" />;
}
