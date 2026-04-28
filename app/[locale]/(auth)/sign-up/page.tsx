import { setRequestLocale, getTranslations } from "next-intl/server";

import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/shared/i18n/navigation";

export default async function SignUpPage({
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
        <CardTitle>{t("auth.signUp.title")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("auth.signUp.subtitle")}
        </p>
        <AuthForm
          mode="sign-up"
          locale={locale}
          labels={{
            name: t("auth.signUp.name"),
            email: t("auth.signIn.email"),
            password: t("auth.signIn.password"),
            submit: t("auth.signUp.submit"),
            loading: t("auth.loading"),
            unavailable: t("auth.unavailable"),
          }}
        />
        <Link
          href="/sign-in"
          className="label-mono text-terracotta hover:underline"
        >
          {t("auth.signUp.toSignIn")}
        </Link>
      </CardBody>
    </Card>
  );
}
