import { setRequestLocale } from "next-intl/server";
import { PolicyShell } from "@/components/layout/policy-shell";

export default async function AcceptableUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PolicyShell title="Acceptable use policy" />;
}
