import { setRequestLocale, getTranslations } from "next-intl/server";

import { AuthForm } from "@/components/auth/auth-form";
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
        <AuthForm
          mode="sign-in"
          locale={locale}
          labels={{
            email: t("auth.signIn.email"),
            password: t("auth.signIn.password"),
            submit: t("auth.signIn.submit"),
            loading: t("auth.loading"),
            unavailable: t("auth.unavailable"),
          }}
        />
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
