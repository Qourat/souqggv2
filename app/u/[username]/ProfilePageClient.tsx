"use client";

import Link from "next/link";
import Nav from "../../components/Nav";

type ProfileData = Record<string, any>;

function formatPrice(cents: number) {
  return cents === 0 ? "free" : `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
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

function stars(n: number) {
  return "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
}

export default function ProfilePageClient({ data }: { data: ProfileData }) {
  const { profile, products, reviewStats } = data;
  const displayName = profile.display_name || profile.username;
  const headline = profile.headline || "";
  const bio = profile.seller_bio || profile.bio || "";
  const joined = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <Nav categories={data.categories || []} />

      <div className="retro-container">
        {/* Breadcrumb */}
        <div className="retro-meta" style={{ padding: "4px 0", borderBottom: "1px solid #e0e0e0" }}>
          <Link href="/" style={{ color: "#828282" }}>home</Link>
          {" / "}
          <span style={{ color: "#000" }}>{displayName}</span>
        </div>

        <table style={{ width: "100%", borderSpacing: 0, marginTop: 4 }}>
          <tbody>
            <tr>
              {/* Main content */}
              <td style={{ verticalAlign: "top", paddingRight: 16 }}>
                {/* Profile header */}
                <div className="retro-card" style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 2, background: "#ff6600", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16pt", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                      {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: 40, height: 40, objectFit: "cover" }} /> : displayName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "12pt" }}>{displayName}</div>
                      <div style={{ color: "#828282", fontSize: "9pt" }}>@{profile.username}</div>
                      {headline && <div style={{ color: "#555", fontSize: "9pt", marginTop: 2 }}>{headline}</div>}
                    </div>
                    <span className="retro-tag" style={{ fontSize: "7pt" }}>{profile.role}</span>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="retro-card" style={{ marginBottom: 4, display: "flex", gap: 16, fontSize: "9pt" }}>
                  <div><span style={{ fontWeight: 700 }}>{profile.product_count}</span> <span className="retro-meta">products</span></div>
                  <div><span style={{ fontWeight: 700 }}>{profile.follower_count}</span> <span className="retro-meta">followers</span></div>
                  <div><span style={{ fontWeight: 700 }}>{profile.following_count}</span> <span className="retro-meta">following</span></div>
                  <div><span style={{ fontWeight: 700 }}>{profile.total_sales}</span> <span className="retro-meta">sales</span></div>
                  {Number(reviewStats.avg_rating) > 0 && (
                    <div><span style={{ color: "#ff6600" }}>{stars(Number(reviewStats.avg_rating))}</span> <span className="retro-meta">({reviewStats.total} reviews)</span></div>
                  )}
                </div>

                {/* Bio */}
                {bio && (
                  <div className="retro-card" style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: "8pt", color: "#828282", fontWeight: 700, borderBottom: "1px solid #e0e0e0", paddingBottom: 2, marginBottom: 4 }}>ABOUT</div>
                    <div style={{ fontSize: "9pt", color: "#333", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{bio}</div>
                  </div>
                )}

                {/* Products */}
                <div className="retro-card" style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: "8pt", color: "#828282", fontWeight: 700, borderBottom: "1px solid #e0e0e0", paddingBottom: 2, marginBottom: 6 }}>
                    PRODUCTS ({products.length})
                  </div>
                  {products.length === 0 ? (
                    <div style={{ color: "#828282", fontSize: "9pt" }}>No products yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderSpacing: 0 }}>
                      <tbody>
                        {products.map((p: any, i: number) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f0f0e8" }}>
                            <td style={{ verticalAlign: "top", paddingTop: 4, paddingBottom: 4, width: 24 }}>
                              <span style={{ color: "#828282", fontSize: "8pt" }}>{i + 1}.</span>
                              <span className="retro-upvote" title="upvote">▲</span>
                            </td>
                            <td style={{ verticalAlign: "top", paddingTop: 4, paddingBottom: 4 }}>
                              <Link href={`/product/${p.slug}`} style={{ fontWeight: 600, fontSize: "10pt" }}>{p.title}</Link>
                              {p.price_cents === 0 ? (
                                <span className="retro-price-free" style={{ marginLeft: 4 }}>FREE</span>
                              ) : (
                                <span style={{ marginLeft: 4, fontSize: "9pt", color: "#333", fontWeight: 600 }}>{formatPrice(p.price_cents)}</span>
                              )}
                              <div className="retro-meta" style={{ marginTop: 1 }}>
                                {p.upvotes} points · <Link href={`/categories?cat=${p.category_slug}`} style={{ color: "#ff6600" }}>{p.category_name}</Link> · {timeAgo(p.created_at)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Activity Feed placeholder */}
                <div className="retro-card" style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: "8pt", color: "#828282", fontWeight: 700, borderBottom: "1px solid #e0e0e0", paddingBottom: 2, marginBottom: 6 }}>ACTIVITY</div>
                  <div style={{ color: "#828282", fontSize: "9pt" }}>
                    <div style={{ padding: "3px 0", borderBottom: "1px solid #f0f0e8" }}>
                      <span style={{ color: "#ff6600" }}>●</span> Joined SOUQ.GG · {joined}
                    </div>
                    {products.length > 0 && (
                      <div style={{ padding: "3px 0", borderBottom: "1px solid #f0f0e8" }}>
                        <span style={{ color: "#ff6600" }}>●</span> Listed {products.length} product{products.length > 1 ? "s" : ""}
                      </div>
                    )}
                    {Number(profile.total_sales) > 0 && (
                      <div style={{ padding: "3px 0", borderBottom: "1px solid #f0f0e8" }}>
                        <span style={{ color: "#ff6600" }}>●</span> Made {profile.total_sales} sale{Number(profile.total_sales) > 1 ? "s" : ""}
                      </div>
                    )}
                    {Number(profile.follower_count) > 0 && (
                      <div style={{ padding: "3px 0" }}>
                        <span style={{ color: "#ff6600" }}>●</span> Reached {profile.follower_count} follower{Number(profile.follower_count) > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Sidebar */}
              <td style={{ verticalAlign: "top", width: 200 }}>
                {/* Follow */}
                <div className="retro-card" style={{ marginBottom: 4 }}>
                  <button className="retro-btn" style={{ width: "100%" }}>Follow</button>
                  <div className="retro-meta" style={{ marginTop: 4, textAlign: "center" }}>{profile.follower_count} followers</div>
                </div>

                {/* Links */}
                <div className="retro-card" style={{ marginBottom: 4, fontSize: "9pt" }}>
                  <div style={{ fontSize: "8pt", color: "#828282", fontWeight: 700, borderBottom: "1px solid #e0e0e0", paddingBottom: 2, marginBottom: 4 }}>INFO</div>
                  {profile.location && (
                    <div style={{ padding: "2px 0" }}>📍 {profile.location}</div>
                  )}
                  {profile.website && (
                    <div style={{ padding: "2px 0" }}>🔗 <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#ff6600" }}>{profile.website.replace(/^https?:\/\//, "")}</a></div>
                  )}
                  {profile.twitter && (
                    <div style={{ padding: "2px 0" }}>🐦 <a href={`https://twitter.com/${profile.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#ff6600" }}>@{profile.twitter.replace("@", "")}</a></div>
                  )}
                  {profile.github && (
                    <div style={{ padding: "2px 0" }}>💻 <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" style={{ color: "#ff6600" }}>{profile.github}</a></div>
                  )}
                  <div style={{ padding: "2px 0" }}>📅 Joined {joined}</div>
                </div>

                {/* More from seller */}
                {products.length > 1 && (
                  <div className="retro-card" style={{ fontSize: "9pt" }}>
                    <div style={{ fontSize: "8pt", color: "#828282", fontWeight: 700, borderBottom: "1px solid #e0e0e0", paddingBottom: 2, marginBottom: 4 }}>MORE BY {displayName.toUpperCase()}</div>
                    {products.slice(0, 5).map((p: any) => (
                      <div key={p.id} style={{ padding: "2px 0", borderBottom: "1px solid #f0f0e8" }}>
                        <Link href={`/product/${p.slug}`} style={{ fontSize: "8pt" }}>{p.title}</Link>
                        <span className="retro-meta"> · {p.upvotes}pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ borderTop: "2px solid #ff6600", marginTop: 12, padding: "6px 0", fontSize: "8pt", color: "#828282" }}>
          <Link href="/">home</Link> |
          <Link href="/categories"> categories</Link> |
          <Link href="/submit"> submit</Link> |
          <Link href="/"> SOUQ.GG</Link>
          <br /><span style={{ fontSize: "7pt" }}>© 2026 SOUQ.GG</span>
        </div>
      </div>
    </>
  );
}