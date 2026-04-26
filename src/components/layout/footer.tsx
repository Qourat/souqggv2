import { getTranslations } from "next-intl/server";

import { Link } from "@/shared/i18n/navigation";

import { NewsletterForm } from "./newsletter-form";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="container py-6 grid gap-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-md font-bold">{t("common.brand")}</span>
            <span className="label-mono">/ {t("common.tagline")}</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mb-3">
            {t("footer.newsletter.body")}
          </p>
          <NewsletterForm
            placeholder={t("footer.newsletter.placeholder")}
            cta={t("footer.newsletter.submit")}
          />
        </div>

        <Column title={t("footer.links.shop")}>
          <FooterLink href="/products" label={t("nav.shop")} />
          <FooterLink href="/categories" label={t("nav.categories")} />
          <FooterLink href="/bundles" label={t("nav.bundles")} />
        </Column>

        <Column title={t("footer.links.legal")}>
          <FooterLink href="/legal/terms" label={t("footer.legal.terms")} />
          <FooterLink href="/legal/privacy" label={t("footer.legal.privacy")} />
          <FooterLink href="/legal/refund" label={t("footer.legal.refund")} />
          <FooterLink href="/legal/downloads" label={t("footer.legal.downloads")} />
          <FooterLink href="/legal/acceptable-use" label={t("footer.legal.acceptable")} />
          <FooterLink href="/legal/dmca" label={t("footer.legal.dmca")} />
        </Column>
      </div>
      <div className="border-t border-border">
        <div className="container py-3 flex items-center justify-between label-mono">
          <span>© {year} {t("common.brand")}.</span>
          <span>{t("footer.rights")}</span>
        </div>
      </div>
    </footer>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="label-mono mb-2">{title}</h4>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        {label}
      </Link>
    </li>
  );
}
