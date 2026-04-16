import Nav from "@/app/components/Nav";
import Link from "next/link";
import { sql } from "@/lib/db";

export const revalidate = 60;

async function getData() {
  const products = await sql`
    SELECT p.id, p.title, p.slug, p.price_cents, p.upvotes, p.created_at,
           p.description, p.screenshot_url, p.product_type,
           c.name as category_name, c.slug as category_slug,
           pr.username as seller_username, pr.display_name as seller_name,
           pr.avatar_url as seller_avatar
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    LEFT JOIN public.profiles pr ON p.seller_id = pr.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC, p.upvotes DESC
  `;

  const categories = await sql`
    SELECT c.id, c.name, c.slug,
           (SELECT COUNT(*) FROM public.products WHERE category_id = c.id AND status = 'active') as product_count
    FROM public.categories c
    ORDER BY product_count DESC, c.name
    LIMIT 12
  `;

  return {
    products,
    categories: categories.filter((c: any) => Number(c.product_count) > 0),
  };
}

function formatPrice(cents: number) {
  return cents === 0 ? "free" : `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export default async function NewestPage() {
  const { products, categories } = await getData();

  return (
    <>
      <Nav categories={categories as any[]} />

      <div className="retro-container" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
          Newest listings — sorted by submission time
        </span>
      </div>

      {categories.length > 0 && (
        <div className="retro-container font-mono" style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.875rem" }}>
          {(categories as any[]).map((c: any, i: number) => (
            <span key={c.id}>
              {i > 0 && <span style={{ color: "var(--text-faint)" }}> | </span>}
              <Link href={`/categories?cat=${c.slug}`} style={{ color: "var(--text-muted)" }}>
                {c.name}
              </Link>
            </span>
          ))}
        </div>
      )}

      <div className="retro-container">
        <table style={{ width: "100%", borderSpacing: 0 }}>
          <tbody>
            {(products as any[]).map((p: any, i: number) => {
              const sellerDisplay = p.seller_name || p.seller_username || "anon";
              const sellerLink = p.seller_username ? `/u/${p.seller_username}` : "#";
              const isFree = p.price_cents === 0;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ verticalAlign: "top", paddingTop: 6, width: 50, textAlign: "right", paddingRight: 6 }}>
                    <span className="font-mono" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{i + 1}.</span>
                    <span className="retro-upvote" title="upvote">{'\u25B2'}</span>
                  </td>
                  <td style={{ verticalAlign: "top", paddingTop: 6, paddingBottom: 6 }}>
                    <div>
                      <Link href={`/product/${p.slug}`} className="retro-title">
                        {p.title}
                      </Link>
                      {isFree && (
                        <span className="retro-price-free" style={{ marginLeft: 6 }}>
                          FREE
                        </span>
                      )}
                      {!isFree && (
                        <span className="font-mono" style={{ marginLeft: 6, fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                          {formatPrice(p.price_cents)}
                        </span>
                      )}
                      {p.product_type && <span className="retro-tag" style={{ marginLeft: 4 }}>{p.product_type}</span>}
                      {p.screenshot_url && (
                        <Link href={`/product/${p.slug}`} className="font-mono" style={{ marginLeft: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          [img]
                        </Link>
                      )}
                    </div>
                    <div className="retro-meta" style={{ marginTop: 2 }}>
                      {p.upvotes} points ·{" "}
                      <Link href={`/categories?cat=${p.category_slug}`} style={{ color: "var(--link-accent)" }}>
                        {p.category_name}
                      </Link>{" "}
                      · by <Link href={sellerLink}>{sellerDisplay}</Link> · {timeAgo(p.created_at)} ago ·{" "}
                      <Link href={`/product/${p.slug}#reviews`} style={{ color: "var(--text-muted)" }}>
                        reviews
                      </Link>{" "}
                      ·{" "}
                      <Link href={`/product/${p.slug}#comments`} style={{ color: "var(--text-muted)" }}>
                        comments
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(products as any[]).length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No products yet.{" "}
            <Link href="/submit" style={{ color: "var(--link-accent)", fontWeight: 700 }}>
              Submit the first one
            </Link>
            .
          </div>
        )}

        <div className="font-mono" style={{ padding: "8px 0", borderTop: "1px solid var(--border-subtle)", marginTop: 4, fontSize: "0.875rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)" }}>
            ? Top / popular
          </Link>
        </div>

        <div className="font-mono" style={{ borderTop: "2px dashed var(--accent-terracotta)", marginTop: 12, padding: "6px 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          <Link href="/about">About</Link> |<Link href="/faq"> FAQ</Link> |<Link href="/api-docs"> API</Link> |
          <Link href="/categories"> Categories</Link> |<Link href="/submit"> Submit</Link> |<Link href="/login"> Login</Link> |
          <Link href="/signup"> Sign Up</Link>
          <br />
          <span style={{ fontSize: "0.75rem" }}>© 2026 SOUQ.GG</span>
        </div>
      </div>
    </>
  );
}
