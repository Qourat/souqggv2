import { Link } from "@/shared/i18n/navigation";
import { categoriesController } from "@/modules/categories";
import { cn } from "@/shared/utils";

/**
 * Horizontal category chips. One row, scrolls horizontally on mobile.
 *
 * Psychology applied:
 *   - Miller's law: limits visible categories to chunks of 7 (we have 7 v1).
 *   - Recognition over recall: every category visible at once vs. dropdown.
 *   - Active state inverts colors → strong Stroop signal of "you are here".
 */
export async function CategoryStrip({
  activeSlug,
}: {
  activeSlug?: string | null;
}) {
  const categories = await categoriesController.list();

  return (
    <nav
      aria-label="Categories"
      className="border-b border-border bg-surface"
    >
      <div className="container h-subnav flex items-center gap-1 overflow-x-auto">
        <Chip href="/products" active={!activeSlug} label="All" />
        {categories.map((c) => (
          <Chip
            key={c.id}
            href={`/categories/${c.slug}`}
            active={activeSlug === c.slug}
            label={c.name}
          />
        ))}
      </div>
    </nav>
  );
}

function Chip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center h-7 px-2.5 shrink-0 border-hairline rounded-sm",
        "label-mono transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-raised",
      )}
    >
      {label}
    </Link>
  );
}
