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
    ORDER BY p.upvotes DESC, p.created_at DESC
  `;

  const categories = await sql`
    SELECT c.id, c.name, c.slug,
           (SELECT COUNT(*) FROM public.products WHERE category_id = c.id AND status = 'active') as product_count
    FROM public.categories c
    ORDER BY product_count DESC, c.name
    LIMIT 12
  `;

  const stats = await sql`
    SELECT
      (SELECT COUNT(*) FROM public.products WHERE status = 'active') as total_products,
      (SELECT COUNT(*) FROM public.profiles) as total_sellers
  `;

  return {
    products,
    categories: categories.filter((c: any) => Number(c.product_count) > 0),
    stats: stats[0] || { total_products: 0, total_sellers: 0 },
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

export default async function Home() {
  const { products, categories, stats } = await getData();

  return (
    <>
      <Nav categories={categories as any[]} />

      {/* Tagline */}
      <div className="retro-container" style={{ padding: "6px 8px", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: 12, color: "#828282" }}>
          The market for digital products — {Number(stats.total_products)} products, {Number(stats.total_sellers)} sellers
        </span>
      </div>

      {/* Category Bar */}
      {categories.length > 0 && (
        <div className="retro-container" style={{ padding: "4px 8px", borderBottom: "1px solid #e0e0e0", fontSize: "8pt" }}>
          {categories.map((c: any, i: number) => (
            <span key={c.id}>
              {i > 0 && <span style={{ color: "#ccc" }}> | </span>}
              <Link href={`/categories?cat=${c.slug}`} style={{ color: "#828282" }}>{c.name}</Link>
            </span>
          ))}
        </div>
      )}

      <div className="retro-container">
        {/* Product list — classic HN feed style */}
        <table style={{ width: "100%", borderSpacing: 0 }}>
          <tbody>
            {products.map((p: any, i: number) => {
              const sellerDisplay = p.seller_name || p.seller_username || "anon";
              const sellerLink = p.seller_username ? `/u/${p.seller_username}` : "#";
              const isFree = p.price_cents === 0;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  {/* Rank + Upvote */}
                  <td style={{ verticalAlign: "top", paddingTop: 6, width: 50, textAlign: "right", paddingRight: 6 }}>
                    <span style={{ color: "#828282", fontSize: "9pt" }}>{i + 1}.</span>
                    <span className="retro-upvote" title="upvote">▲</span>
                  </td>
                  {/* Content */}
                  <td style={{ verticalAlign: "top", paddingTop: 6, paddingBottom: 6 }}>
                    <div>
                      <Link href={`/product/${p.slug}`} className="retro-title" style={{ fontSize: "12pt" }}>
                        {p.title}
                      </Link>
                      {isFree && <span className="retro-price-free" style={{ marginLeft: 6 }}>FREE</span>}
                      {!isFree && (
                        <span style={{ marginLeft: 6, fontSize: "9pt", color: "#333", fontWeight: 600 }}>
                          {formatPrice(p.price_cents)}
                        </span>
                      )}
                      {p.product_type && (
                        <span className="retro-tag" style={{ marginLeft: 4 }}>{p.product_type}</span>
                      )}
                      {p.screenshot_url && (
                        <Link href={`/product/${p.slug}`} style={{ marginLeft: 4, fontSize: "7pt", color: "#828282" }}>[img]</Link>
                      )}
                    </div>
                    <div className="retro-meta" style={{ marginTop: 2 }}>
                      {p.upvotes} points · <Link href={`/categories?cat=${p.category_slug}`} style={{ color: "#ff6600" }}>{p.category_name}</Link> · by <Link href={sellerLink}>{sellerDisplay}</Link> · {timeAgo(p.created_at)} ago
                      {" · "}
                      <Link href={`/product/${p.slug}#reviews`} style={{ color: "#828282" }}>reviews</Link>
                      {" · "}
                      <Link href={`/product/${p.slug}#comments`} style={{ color: "#828282" }}>comments</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#828282" }}>
            No products yet. <Link href="/submit" style={{ color: "#ff6600" }}>Submit the first one</Link>.
          </div>
        )}

        {/* Pagination hint */}
        <div style={{ padding: "8px 0", borderTop: "1px solid #e0e0e0", marginTop: 4, fontSize: "9pt" }}>
          <Link href="/newest" style={{ color: "#828282" }}>More →</Link>
        </div>

        {/* Footer links */}
        <div style={{ borderTop: "2px solid #ff6600", marginTop: 12, padding: "6px 0", fontSize: "8pt", color: "#828282" }}>
          <Link href="/about">About</Link> |
          <Link href="/faq"> FAQ</Link> |
          <Link href="/api"> API</Link> |
          <Link href="/categories"> Categories</Link> |
          <Link href="/submit"> Submit</Link> |
          <Link href="/login"> Login</Link> |
          <Link href="/signup"> Sign Up</Link>
          <br />
          <span style={{ fontSize: "7pt" }}>© 2026 SOUQ.GG</span>
        </div>
      </div>
    </>
  );
}