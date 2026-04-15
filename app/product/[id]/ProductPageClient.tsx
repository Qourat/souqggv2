"use client";

import Link from "next/link";
import Nav from "../../components/Nav";

type Product = Record<string, any>;
type Review = Record<string, any>;
type Comment = Record<string, any>;

const pricingLabels: Record<string, string> = {
  one_time: "one-time",
  subscription: "monthly",
  pay_what_you_want: "pay what you want",
};

function formatPrice(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function stars(n: number) {
  const f = Math.round(n);
  return "\u2605".repeat(f) + "\u2606".repeat(5 - f);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ProductPageClient({
  product,
  categories,
  reviews,
  comments,
  reviewStats,
}: {
  product: Product;
  categories: Record<string, any>[];
  reviews: Review[];
  comments: Comment[];
  reviewStats: { total: number; avgRating: number };
}) {
  const sellerName = product.seller_display_name || product.seller_username || "anonymous";
  const sellerLink = product.seller_username ? `/u/${product.seller_username}` : "#";
  const tags: string[] = product.tags || [];

  return (
    <>
      <Nav categories={categories} />

      <div className="retro-container">
        <div className="retro-meta" style={{ padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
          <Link href="/" style={{ color: "var(--text-muted)" }}>
            home
          </Link>
          {" / "}
          <Link href={`/categories?cat=${product.category_slug}`} style={{ color: "var(--text-muted)" }}>
            {product.category_name}
          </Link>
          {" / "}
          <span style={{ color: "var(--text-primary)" }}>{product.title}</span>
        </div>

        <div className="product-layout">
          <div className="product-main">
            <div style={{ padding: "8px 0" }}>
              <span className="retro-upvote" title="upvote" style={{ fontSize: "11pt", marginRight: 6 }}>
                {"\u25B2"}
              </span>
              <span style={{ fontWeight: 700, fontSize: "13pt" }}>{product.title}</span>
              {product.price_cents === 0 ? (
                <span className="retro-price-free" style={{ marginLeft: 8 }}>
                  FREE
                </span>
              ) : (
                <span style={{ marginLeft: 8, fontSize: "11pt", fontWeight: 700, color: "var(--text-secondary)" }}>
                  {formatPrice(product.price_cents)}
                </span>
              )}
              {product.product_type && (
                <span className="retro-tag" style={{ marginLeft: 4 }}>
                  {product.product_type}
                </span>
              )}
            </div>

            <div className="retro-meta" style={{ marginBottom: 8 }}>
              {product.upvotes} points ·{" "}
              <Link href={`/categories?cat=${product.category_slug}`} style={{ color: "var(--link-accent)" }}>
                {product.category_name}
              </Link>{" "}
              · by <Link href={sellerLink}>{sellerName}</Link> · {timeAgo(product.created_at)}
              {product.version && <> · v{product.version}</>}
              {" · "}
              <Link href={`/categories?cat=${product.category_slug}`} style={{ color: "var(--text-muted)" }}>
                {pricingLabels[product.pricing_type] || "one-time"}
              </Link>
            </div>

            <div className="mobile-buy-bar">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <span style={{ fontSize: "14pt", fontWeight: 700, color: "var(--text-primary)" }}>
                    {formatPrice(product.price_cents)}
                  </span>
                  <span className="retro-meta" style={{ marginLeft: 6 }}>
                    {pricingLabels[product.pricing_type] || "one-time"}
                  </span>
                </div>
                <Link href={`/checkout/${product.slug}`} className="retro-btn" style={{ fontSize: "10pt", padding: "6px 16px" }}>
                  {product.price_cents === 0 ? "Get Free" : "Buy Now"}
                </Link>
              </div>
            </div>

            {product.screenshot_url && (
              <div className="retro-card" style={{ marginBottom: 8, padding: 0, overflow: "hidden" }}>
                <img src={product.screenshot_url} alt={product.title} style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />
              </div>
            )}

            <div className="desktop-buy-bar" style={{ marginBottom: 12 }}>
              <Link href={`/checkout/${product.slug}`} className="retro-btn">
                {product.price_cents === 0 ? "Get Free" : "Buy Now"}
              </Link>
              {product.demo_url && (
                <a href={product.demo_url} target="_blank" rel="noopener noreferrer" className="retro-btn-secondary" style={{ marginLeft: 6 }}>
                  Live Demo {"\u2197"}
                </a>
              )}
            </div>

            <div className="retro-card">
              <div
                style={{
                  fontSize: "8pt",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  marginBottom: 4,
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 2,
                }}
              >
                DESCRIPTION
              </div>
              <div style={{ fontSize: "9.5pt", color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {product.description || "No description provided."}
              </div>
              {tags.length > 0 && (
                <div style={{ marginTop: 8, borderTop: "1px solid var(--border-subtle)", paddingTop: 6 }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "7pt",
                        background: "var(--surface-raised)",
                        color: "var(--text-muted)",
                        padding: "1px 4px",
                        marginRight: 3,
                        borderRadius: 2,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="retro-card" style={{ fontSize: "9pt" }}>
              <div
                style={{
                  fontSize: "8pt",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  marginBottom: 4,
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 2,
                }}
              >
                DETAILS
              </div>
              <table style={{ width: "100%" }}>
                <tbody>
                  {product.version && (
                    <tr>
                      <td style={{ color: "var(--text-muted)", paddingRight: 8, width: 100 }}>
                        Version
                      </td>
                      <td>{product.version}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: "var(--text-muted)", paddingRight: 8, width: 100 }}>
                      License
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{product.license_type || "Standard"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--text-muted)", paddingRight: 8 }}>Pricing</td>
                    <td>{pricingLabels[product.pricing_type] || "One-time"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--text-muted)", paddingRight: 8 }}>Category</td>
                    <td>
                      <Link href={`/categories?cat=${product.category_slug}`} style={{ color: "var(--link-accent)" }}>
                        {product.category_name}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--text-muted)", paddingRight: 8 }}>Type</td>
                    <td style={{ textTransform: "capitalize" }}>{product.product_type || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--text-muted)", paddingRight: 8 }}>Listed</td>
                    <td>{new Date(product.created_at).toLocaleDateString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div id="reviews" className="retro-card" style={{ marginTop: 4 }}>
              <div
                style={{
                  fontSize: "8pt",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 2,
                  marginBottom: 6,
                }}
              >
                REVIEWS{" "}
                {reviewStats.total > 0 && (
                  <span style={{ color: "var(--link-accent)" }}>
                    {stars(reviewStats.avgRating)} {reviewStats.avgRating} ({reviewStats.total})
                  </span>
                )}
              </div>
              {reviews.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "9pt", padding: "8px 0" }}>
                  No reviews yet.{" "}
                  <Link href="#" style={{ color: "var(--link-accent)" }}>
                    Be the first
                  </Link>
                  .
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)", padding: "4px 0" }}>
                    <span style={{ color: "var(--link-accent)", fontSize: "9pt" }}>{stars(r.rating)}</span>{" "}
                    <Link href={`/u/${r.reviewer_username}`} style={{ fontSize: "8pt", fontWeight: 600 }}>
                      {r.reviewer_name || r.reviewer_username}
                    </Link>{" "}
                    <span className="retro-meta">{timeAgo(r.created_at)}</span>
                    {r.title && <div style={{ fontSize: "9pt", fontWeight: 600, marginTop: 2 }}>{r.title}</div>}
                    {r.body && (
                      <div style={{ fontSize: "9pt", color: "var(--text-secondary)", marginTop: 1 }}>{r.body}</div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div id="comments" className="retro-card" style={{ marginTop: 4 }}>
              <div
                style={{
                  fontSize: "8pt",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 2,
                  marginBottom: 6,
                }}
              >
                COMMENTS ({comments.length})
              </div>
              {comments.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "9pt", padding: "8px 0" }}>
                  No comments yet.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)", padding: "4px 0" }}>
                    <Link href={`/u/${c.commenter_username}`} style={{ fontSize: "8pt", fontWeight: 600 }}>
                      {c.commenter_name || c.commenter_username}
                    </Link>{" "}
                    <span className="retro-meta">{timeAgo(c.created_at)}</span>
                    <div style={{ fontSize: "9pt", color: "var(--text-secondary)", marginTop: 1 }}>{c.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="product-sidebar">
            <div className="retro-card" style={{ marginBottom: 4 }}>
              <div style={{ fontSize: "14pt", fontWeight: 700, color: "var(--text-primary)" }}>
                {formatPrice(product.price_cents)}
              </div>
              <div className="retro-meta">{pricingLabels[product.pricing_type] || "one-time"}</div>
              <div style={{ marginTop: 8 }}>
                <Link href={`/checkout/${product.slug}`} className="retro-btn" style={{ display: "block", textAlign: "center" }}>
                  {product.price_cents === 0 ? "Get Free" : "Buy Now"}
                </Link>
              </div>
            </div>

            {product.seller_username && (
              <div className="retro-card" style={{ marginBottom: 4 }}>
                <div
                  style={{
                    fontSize: "8pt",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: 2,
                    marginBottom: 6,
                  }}
                >
                  SELLER
                </div>
                <Link href={sellerLink} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 2,
                        background: "var(--link-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--surface-card)",
                        fontSize: "11pt",
                        fontWeight: 700,
                        overflow: "hidden",
                      }}
                    >
                      {product.seller_avatar ? (
                        <img src={product.seller_avatar} alt="" style={{ width: 28, height: 28, objectFit: "cover" }} />
                      ) : (
                        sellerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "9pt", color: "var(--text-primary)" }}>{sellerName}</div>
                      {product.seller_headline && <div className="retro-meta">{product.seller_headline}</div>}
                    </div>
                  </div>
                </Link>
                <div className="retro-meta" style={{ marginTop: 4 }}>
                  {product.seller_product_count} products · {product.seller_followers} followers
                </div>
                <div style={{ marginTop: 4 }}>
                  <Link href={sellerLink} className="retro-btn-secondary" style={{ fontSize: "8pt" }}>
                    View Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: "2px dashed var(--accent-terracotta)",
            marginTop: 12,
            padding: "6px 0",
            fontSize: "8pt",
            color: "var(--text-muted)",
          }}
        >
          <Link href="/">home</Link> |<Link href="/categories"> categories</Link> |<Link href="/submit"> submit</Link> |
          <Link href="/"> SOUQ.GG</Link>
          <br />
          <span style={{ fontSize: "0.75rem" }}>© 2026 SOUQ.GG</span>
        </div>
      </div>
    </>
  );
}
