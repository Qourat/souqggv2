import { Sparkles, AlertCircle } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AiRunner } from "@/components/admin/ai-runner";
import { Badge } from "@/components/ui/badge";
import { hasSupabase } from "@/shared/db/has-supabase";
import { aiController } from "@/modules/ai";
import type { AiAgentDescriptor, AiAgentId, AiJob } from "@/modules/ai";

export const dynamic = "force-dynamic";

const AGENT_NAME_KEY: Record<AiAgentId, string> = {
  listing: "admin.ai.agent.listing.label",
  seo: "admin.ai.agent.seo.label",
  marketing: "admin.ai.agent.marketing.label",
  qa: "admin.ai.agent.qa.label",
  compliance: "admin.ai.agent.compliance.label",
};

const AGENT_DESC_KEY: Record<AiAgentId, string> = {
  listing: "admin.ai.agent.listing.description",
  seo: "admin.ai.agent.seo.description",
  marketing: "admin.ai.agent.marketing.description",
  qa: "admin.ai.agent.qa.description",
  compliance: "admin.ai.agent.compliance.description",
};

export default async function AdminAiToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();
  const aiEnabled = aiController.isEnabled();

  const agents = aiController.listAgents();
  const recent: AiJob[] = supabaseReady
    ? await aiController.listRecent(undefined, 25).catch(() => [])
    : [];

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-terracotta" />
            {t("admin.nav.aiTools")}
          </span>
        }
        subtitle={t("admin.ai.subtitle")}
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}

      {!aiEnabled ? (
        <div className="border-hairline border-gold/40 bg-gold/10 rounded-sm p-2 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" />
          <div className="text-xs">
            <div className="font-mono font-medium">
              {t("admin.ai.disabled.title")}
            </div>
            <div className="text-muted-foreground mt-0.5">
              {t("admin.ai.disabled.body")}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((d) => (
          <AgentCard key={d.id} descriptor={d} t={t} />
        ))}
      </div>

      <section className="space-y-2 pt-2">
        <header className="flex items-end justify-between border-b border-border pb-1.5">
          <h2 className="font-mono text-sm">{t("admin.ai.history.title")}</h2>
          <span className="label-mono text-muted-foreground">
            {recent.length}
          </span>
        </header>

        <div className="border-hairline rounded-sm bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-start label-mono px-3 h-7 w-32">
                  {t("admin.ai.history.col.agent")}
                </th>
                <th className="text-start label-mono px-2 h-7 w-24">
                  {t("admin.ai.history.col.status")}
                </th>
                <th className="text-end label-mono px-2 h-7 w-24">
                  {t("admin.ai.history.col.cost")}
                </th>
                <th className="text-end label-mono px-2 h-7 w-24">
                  {t("admin.ai.history.col.duration")}
                </th>
                <th className="text-start label-mono px-2 h-7">
                  {t("admin.ai.history.col.created")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((job) => {
                const cost = Number(job.costUsd ?? 0);
                const seconds = job.durationMs ? job.durationMs / 1000 : 0;
                const created =
                  job.createdAt instanceof Date
                    ? job.createdAt
                    : new Date(job.createdAt as unknown as string);
                const variant: React.ComponentProps<typeof Badge>["variant"] =
                  job.status === "succeeded"
                    ? "sage"
                    : job.status === "failed"
                      ? "danger"
                      : "ghost";
                return (
                  <tr
                    key={job.id}
                    className="border-b border-border last:border-0 row-hover"
                  >
                    <td className="px-3 py-2 font-mono text-sm">
                      {AGENT_NAME_KEY[job.agent as AiAgentId]
                        ? t(AGENT_NAME_KEY[job.agent as AiAgentId])
                        : job.agent}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant={variant}>
                        {t(`admin.ai.status.${job.status}`)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-end label-mono tnum">
                      ${cost.toFixed(4)}
                    </td>
                    <td className="px-2 py-2 text-end label-mono tnum">
                      {seconds > 0 ? `${seconds.toFixed(1)}s` : "—"}
                    </td>
                    <td className="px-2 py-2 label-mono">
                      {created.toLocaleString(locale)}
                    </td>
                  </tr>
                );
              })}
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center label-mono">
                    {t("admin.ai.history.empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AgentCard({
  descriptor,
  t,
}: {
  descriptor: AiAgentDescriptor;
  t: (key: string) => string;
}) {
  const name = AGENT_NAME_KEY[descriptor.id]
    ? t(AGENT_NAME_KEY[descriptor.id])
    : descriptor.label;
  const desc = AGENT_DESC_KEY[descriptor.id]
    ? t(AGENT_DESC_KEY[descriptor.id])
    : descriptor.description;
  return (
    <article className="border-hairline rounded-sm bg-surface p-3 space-y-3">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-sm">{name}</h3>
          <span className="label-mono text-muted-foreground">
            {descriptor.id}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </header>
      <AiRunner descriptor={descriptor} />
    </article>
  );
}
