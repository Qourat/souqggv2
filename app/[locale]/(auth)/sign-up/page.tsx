import { setRequestLocale, getTranslations } from "next-intl/server";

import { Button, Input } from "@/components/ui";
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
        <form className="space-y-2.5">
          <div>
            <label className="label-mono mb-1 block">{t("auth.signUp.name")}</label>
            <Input type="text" required />
          </div>
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
            {t("auth.signUp.submit")}
          </Button>
        </form>
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
