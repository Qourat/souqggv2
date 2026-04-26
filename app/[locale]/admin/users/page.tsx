import { setRequestLocale } from "next-intl/server";
import { SprintStub } from "@/components/layout/sprint-stub";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SprintStub title="Users" sprint="Sprint 3 — Library & Delivery" />;
}
