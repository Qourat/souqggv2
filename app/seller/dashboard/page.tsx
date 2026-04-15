import Link from "next/link";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";


export const revalidate = 0;

async function getSellerProducts(sellerId: string) {
  return sql`
    SELECT p.*, c.name as category_name
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE p.seller_id = ${sellerId}
    ORDER BY p.created_at DESC
  `;
}

async function getSellerStats(sellerId: string) {
  const [stats] = await sql`
    SELECT
      COUNT(*) as total_products,
      COUNT(*) FILTER (WHERE status = 'active') as active_products,
      COALESCE(SUM(upvotes), 0) as total_upvotes
    FROM public.products
    WHERE seller_id = ${sellerId}
  `;
  return stats;
}

export default async function SellerDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let user: { userId: string; username: string; role: string } | null = null;

  try {
    if (token) {
      user = await verifyToken(token);
    }
  } catch {
    // Invalid token
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-souq-base font-sans text-souq-text">
        <SouqMarketingHeader
          trailing={<span className="souq-badge-pill">Seller</span>}
        />
        <main className="max-w-md mx-auto p-4 mt-20 text-center px-4">
          <h1 className="font-display text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-souq-muted mb-6">You must be logged in as a seller to view this page.</p>
          <Link href="/login" className="retro-btn inline-block">
            Sign in
          </Link>
        </main>
      </div>
    );
  }

  if (user.role !== "seller" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-souq-base font-sans text-souq-text">
        <SouqMarketingHeader
          trailing={<span className="souq-badge-pill">Seller</span>}
        />
        <main className="max-w-md mx-auto p-4 mt-20 text-center px-4">
          <h1 className="font-display text-2xl font-bold mb-4">Upgrade required</h1>
          <p className="text-souq-muted mb-6">You need a seller account to access the dashboard. Your current role: <strong>{user.role}</strong></p>
          <Link href="/onboarding" className="retro-btn inline-block">
            Become a seller
          </Link>
        </main>
      </div>
    );
  }

  const products = await getSellerProducts(user.userId);
  const stats = await getSellerStats(user.userId);

  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader
        trailing={
          <>
            <Link href="/seller/dashboard" className="text-xs font-bold hover:underline">
              Dashboard
            </Link>
            <Link href="/submit" className="text-xs hover:underline">
              + New product
            </Link>
            <span className="text-[10px] opacity-90">({user.username})</span>
          </>
        }
      />

      <main className="max-w-5xl mx-auto p-4 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Seller Dashboard</h1>
            <p className="text-sm text-souq-muted">Welcome back, {user.username}</p>
          </div>
          <Link href="/submit" className="bg-souq-terra text-white text-sm font-bold px-4 py-2 rounded hover:bg-souq-terra-hover">+ New Product</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Products</div>
            <div className="text-2xl font-bold mt-1">{stats?.total_products || 0}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Active</div>
            <div className="text-2xl font-bold mt-1">{stats?.active_products || 0}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Total Upvotes</div>
            <div className="text-2xl font-bold mt-1">{stats?.total_upvotes || 0}</div>
          </div>
        </div>

        {/* Product list */}
        <div className="bg-souq-card border border-souq-line rounded">
          <div className="px-4 py-3 border-b border-souq-line font-bold text-sm">Your Products</div>
          {products.length === 0 ? (
            <div className="p-8 text-center text-souq-muted">
              No products yet. <Link href="/submit" className="text-souq-terra hover:underline">Create your first product</Link>
            </div>
          ) : (
            <div className="divide-y divide-souq-line">
              {products.map((p: any) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-souq-raised">
                  <div>
                    <Link href={`/product/${p.slug || p.id}`} className="font-bold text-sm hover:underline">{p.title}</Link>
                    <div className="text-xs text-souq-muted mt-1">
                      {p.category_name && <span>{p.category_name} · </span>}
                      <span>{(p.price_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                      <span> · {p.upvotes} upvotes</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-souq-raised text-souq-muted"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}