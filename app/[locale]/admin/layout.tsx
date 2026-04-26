import { getTranslations } from "next-intl/server";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-header border-b border-border bg-surface flex items-center px-3">
          <span className="font-mono text-sm">souq · admin</span>
          <span className="ml-3 label-mono">{t("admin.nav.dashboard")}</span>
        </header>
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
