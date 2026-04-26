import { setRequestLocale, getTranslations } from "next-intl/server";

import { Button, Input } from "@/components/ui";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ForgotPasswordPage({
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
        <CardTitle>{t("auth.forgot.title")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-muted-foreground">{t("auth.forgot.subtitle")}</p>
        <form className="space-y-2.5">
          <Input type="email" placeholder={t("auth.signIn.email")} required />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {t("auth.forgot.submit")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
