import { useTranslations } from "next-intl";

import { Link } from "@/shared/i18n/navigation";
import type { CategoryDto } from "@/modules/categories";
import { cn } from "@/shared/utils";

const TYPES = [
  "pdf",
  "excel",
  "word",
  "notion",
  "prompt_pack",
  "template",
  "course",
  "code",
  "dataset",
  "bundle",
] as const;

const PRICE_BUCKETS = [
  { label: "Free", min: 0, max: 0 },
  { label: "$1–$10", min: 1, max: 1000 },
  { label: "$10–$25", min: 1000, max: 2500 },
  { label: "$25–$50", min: 2500, max: 5000 },
  { label: "$50+", min: 5000, max: undefined },
] as const;

interface FilterSidebarProps {
  categories: CategoryDto[];
  active: {
    category?: string;
    type?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
  };
}

/**
 * Compact filter sidebar (192px wide). Three groups, each capped at ~7
 * visible items (Miller's law).
 *
 * Filters are URL-driven (Link components, no JS) so the page is
 * server-rendered, shareable, and works without hydration.
 */
export function FilterSidebar({ categories, active }: FilterSidebarProps) {
  const t = useTranslations();

  return (
    <aside className="border-hairline rounded-sm bg-surface divide-y divide-border">
      <Group title={t("shop.filter.category")}>
        <FilterLink
          href={buildHref(active, { category: undefined })}
          label="All"
          active={!active.category}
        />
        {categories.map((c) => (
          <FilterLink
            key={c.id}
            href={buildHref(active, { category: c.slug })}
            label={c.name}
            active={active.category === c.slug}
          />
        ))}
      </Group>

      <Group title={t("shop.filter.type")}>
        <FilterLink
          href={buildHref(active, { type: undefined })}
          label="All"
          active={!active.type}
        />
        {TYPES.map((tp) => (
          <FilterLink
            key={tp}
            href={buildHref(active, { type: tp })}
            label={t(`product.type.${tp}`)}
            active={active.type === tp}
          />
        ))}
      </Group>

      <Group title={t("shop.filter.price")}>
        <FilterLink
          href={buildHref(active, {
            minPriceCents: undefined,
            maxPriceCents: undefined,
          })}
          label="Any"
          active={
            typeof active.minPriceCents === "undefined" &&
            typeof active.maxPriceCents === "undefined"
          }
        />
        {PRICE_BUCKETS.map((b) => (
          <FilterLink
            key={b.label}
            href={buildHref(active, {
              minPriceCents: b.min,
              maxPriceCents: b.max,
            })}
            label={b.label}
            active={
              active.minPriceCents === b.min && active.maxPriceCents === b.max
            }
          />
        ))}
      </Group>

      <div className="px-3 py-2">
        <Link
          href="/products"
          className="label-mono text-terracotta hover:underline"
        >
          {t("shop.filter.clear")}
        </Link>
      </div>
    </aside>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 py-2.5">
      <h3 className="label-mono mb-1.5">{title}</h3>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "block py-0.5 text-xs",
          active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "inline-block w-1 h-1 mr-1.5 rounded-full align-middle",
            active ? "bg-terracotta" : "bg-transparent",
          )}
        />
        {label}
      </Link>
    </li>
  );
}

function buildHref(
  current: FilterSidebarProps["active"],
  patch: Partial<FilterSidebarProps["active"]>,
): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  if (merged.category) params.set("category", merged.category);
  if (merged.type) params.set("type", merged.type);
  if (typeof merged.minPriceCents === "number")
    params.set("minPriceCents", String(merged.minPriceCents));
  if (typeof merged.maxPriceCents === "number")
    params.set("maxPriceCents", String(merged.maxPriceCents));
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}
