import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations();
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-sm space-y-3">
        <p className="font-mono text-3xl">404</p>
        <h1 className="font-mono text-md">{t("errors.notFound.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("errors.notFound.body")}</p>
        <Button asChild variant="primary">
          <Link href="/">{t("errors.notFound.cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
