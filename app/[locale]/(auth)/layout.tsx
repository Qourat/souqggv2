import { Link } from "@/shared/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border h-header">
        <div className="container h-full flex items-center">
          <Link href="/" className="font-mono font-bold text-md">
            {t("common.brand")}
          </Link>
        </div>
      </header>
      <main className="flex-1 grid place-items-center px-4 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
