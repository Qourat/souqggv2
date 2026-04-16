import Link from 'next/link';
import { sql } from '@/lib/db';

const SORT_ORDER: Record<string, string> = {
  newest: 'p.created_at DESC',
  popular: 'p.upvotes DESC',
  price_low: 'p.price_cents ASC',
};

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatPrice(cents: number, type: string) {
  if (type === 'pwyw') return 'PWYW';
  if (cents === 0) return 'Free';
  const dollars = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  return type === 'subscription' ? `$${dollars}/mo` : `$${dollars}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const { category, sort: sortRaw, q: search } = await searchParams;
  const sort = sortRaw || 'newest';
  const orderBy = SORT_ORDER[sort] ?? SORT_ORDER.newest;

  const products = await sql`
    SELECT p.id, p.title, p.slug, p.price_cents, p.pricing_type, p.product_type,
           p.upvotes, p.created_at, p.tags,
           c.slug as category_slug, c.name as category_name,
           pr.username as seller_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN profiles pr ON p.seller_id = pr.id
    WHERE p.status = 'active'
    ${category ? sql` AND c.slug = ${category}` : sql``}
    ${search ? sql` AND p.title ILIKE ${'%' + search + '%'}` : sql``}
    ORDER BY ${sql.unsafe(orderBy)}
    LIMIT 50
  `;

  const categories = await sql`SELECT slug, name FROM categories ORDER BY sort_order`;

  return (
    <div className="max-w-5xl mx-auto px-2 py-1 bg-souq-base min-h-screen">
      {/* Sub navigation */}
      <div className="flex gap-2 py-1 px-1 text-xs border-b border-souq-line mb-1">
        <Link href="/products" className={!category ? 'font-bold text-souq-text' : 'text-souq-muted hover:underline'}>all</Link>
        {categories.map((c: any) => (
          <Link key={c.slug} href={`/products?category=${c.slug}`}
            className={category === c.slug ? 'font-bold text-souq-text' : 'text-souq-muted hover:underline'}>
            {c.name}
          </Link>
        ))}
      </div>

      {/* Sort options */}
      <div className="flex gap-2 py-1 px-1 text-xs text-souq-muted">
        <span>sort:</span>
        {(['newest', 'popular', 'price_low'] as const).map(s => (
          <Link key={s} href={`/products?category=${category || ''}&sort=${s}`}
            className={sort === s ? 'font-bold text-souq-text' : 'hover:underline'}>
            {s === 'price_low' ? 'price' : s}
          </Link>
        ))}
      </div>

      {/* Product feed — HN style */}
      <table className="w-full text-sm">
        <tbody>
          {products.map((p: any, i: number) => (
            <tr key={p.id} className="border-b border-souq-line">
              <td align="right" className="py-1 pr-1 text-souq-muted text-xs w-8">{i + 1}.</td>
              <td className="py-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-souq-terra text-xs cursor-pointer">{'\u25B2'}</span>
                  <Link href={`/products/${p.slug}`} className="text-souq-text hover:underline font-medium">
                    {p.title}
                  </Link>
                  <span className="text-xs text-souq-muted">
                    ({formatPrice(p.price_cents, p.pricing_type)})
                  </span>
                </div>
                <div className="text-xs text-souq-muted ml-5">
                  {p.category_name && <span className="text-souq-terra">{p.category_name}</span>}
                  <span> · </span>
                  <span>{p.upvotes} points</span>
                  <span> · </span>
                  <span>by {p.seller_name || 'unknown'}</span>
                  <span> · </span>
                  <span>{timeAgo(p.created_at)}</span>
                  {p.tags && p.tags.length > 0 && (
                    <span> · {p.tags.map((t: string) => (
                      <Link key={t} href={`/products?q=${encodeURIComponent(t)}`} className="text-souq-sage underline-offset-2 hover:underline mr-1">
                        {t}
                      </Link>
                    ))}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={2} className="py-4 text-center text-souq-muted text-sm">No products found</td></tr>
          )}
        </tbody>
      </table>

      {/* Submit link */}
      <div className="py-2 text-xs text-souq-muted border-t border-souq-line mt-1">
        <Link href="/submit" className="hover:underline">Submit a product</Link>
      </div>
    </div>
  );
}
