import { setRequestLocale } from "next-intl/server";
import { SprintStub } from "@/components/layout/sprint-stub";

export default async function AdminAiToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SprintStub
      title="AI tools"
      sprint="Sprint 6 — Internal AI"
      body="Internal-only agents: research, creation, QA, compliance, listing, SEO, marketing, ops."
    />
  );
}
