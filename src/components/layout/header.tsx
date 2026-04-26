import { getTranslations, getLocale } from "next-intl/server";
import { User2, Search } from "lucide-react";

import { Link } from "@/shared/i18n/navigation";

import { CartPill } from "./cart-pill";
import { LocaleSwitcher } from "./locale-switcher";

/**
 * Compact header (44px). Layout follows F-pattern reading priority:
 *
 *   [brand] [search ──────] [nav] [cart] [account] [locale]
 *      ↑ identity   ↑ primary task    ↑ secondary actions
 *
 * Psychology applied:
 *   - Hick's law: ≤7 elements in the bar; nav links are inline + minimal.
 *   - Fitts: cart and account targets are 28px square (corner-adjacent).
 *   - Recognition: ⌘K hint visible inside the search input.
 *   - Anchoring: brand + tagline establish "this is a fast tool" mental
 *     model before the user touches anything.
 */
export async function Header() {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container flex items-center gap-3 h-header">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label={t("common.brand")}
        >
          <span className="font-mono text-md font-bold tracking-tight group-hover:text-terracotta transition-colors">
            {t("common.brand")}
          </span>
          <span className="hidden sm:inline label-mono text-muted-foreground">
            / {t("common.tagline")}
          </span>
        </Link>

        <div className="flex-1 hidden md:flex">
          <SearchBar placeholder={t("common.search")} locale={locale} />
        </div>

        <nav className="hidden lg:flex items-center gap-3 label-mono">
          <Link href="/products" className="hover:text-foreground text-muted-foreground">
            {t("nav.shop")}
          </Link>
          <Link href="/categories" className="hover:text-foreground text-muted-foreground">
            {t("nav.categories")}
          </Link>
          <Link href="/bundles" className="hover:text-foreground text-muted-foreground">
            {t("nav.bundles")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/account"
            aria-label={t("common.account")}
            className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-sm border-hairline"
          >
            <User2 className="h-3.5 w-3.5" />
          </Link>
          <CartPill ariaLabel={t("common.cart")} />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}

function SearchBar({
  placeholder,
  locale,
}: {
  placeholder: string;
  locale: string;
}) {
  return (
    <form action={`/${locale}/products`} className="w-full">
      <label className="flex items-center gap-2 h-8 px-2.5 bg-input border-hairline rounded-sm focus-within:outline focus-within:outline-1 focus-within:outline-ring">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          type="search"
          name="q"
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        <kbd className="hidden md:inline label-mono border-hairline rounded-sm px-1 text-3xs">
          ⌘K
        </kbd>
      </label>
    </form>
  );
}

