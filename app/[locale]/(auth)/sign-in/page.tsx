import { setRequestLocale, getTranslations } from "next-intl/server";

import { Button, Input } from "@/components/ui";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/shared/i18n/navigation";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.signIn.title")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("auth.signIn.subtitle")}
        </p>
        <form className="space-y-2.5">
          <div>
            <label className="label-mono mb-1 block">
              {t("auth.signIn.email")}
            </label>
            <Input type="email" required />
          </div>
          <div>
            <label className="label-mono mb-1 block">
              {t("auth.signIn.password")}
            </label>
            <Input type="password" required />
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {t("auth.signIn.submit")}
          </Button>
        </form>
        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="label-mono text-muted-foreground hover:text-foreground"
          >
            {t("auth.signIn.forgot")}
          </Link>
          <Link
            href="/sign-up"
            className="label-mono text-terracotta hover:underline"
          >
            {t("auth.signIn.toRegister")}
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
