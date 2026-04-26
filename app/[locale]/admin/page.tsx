import { setRequestLocale, getTranslations } from "next-intl/server";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

const STATS = [
  { key: "revenueMtd", value: "$0" },
  { key: "orders", value: "0" },
  { key: "products", value: "0" },
  { key: "draftProducts", value: "0" },
  { key: "topProduct", value: "—" },
  { key: "failedPayments", value: "0" },
] as const;

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STATS.map((s) => (
          <Card key={s.key}>
            <CardHeader>
              <CardTitle>{t(`admin.stat.${s.key}`)}</CardTitle>
            </CardHeader>
            <CardBody>
              <span className="font-mono text-lg tnum">{s.value}</span>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
