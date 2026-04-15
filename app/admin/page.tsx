import Link from "next/link";
import { sql } from "@/lib/db";
import AdminShellBar from "@/app/components/AdminShellBar";


export const revalidate = 30;

async function getStats() {
  const [userCount] = await sql`SELECT count(*) as count FROM public.profiles`;
  const [productCount] = await sql`SELECT count(*) as count FROM public.products WHERE status = 'active'`;
  const [sellerCount] = await sql`SELECT count(*) as count FROM public.profiles WHERE role = 'seller'`;
  const [revenue] = await sql`SELECT COALESCE(SUM(price_cents), 0) as total FROM public.products WHERE status = 'active'`;
  return {
    users: Number(userCount.count),
    products: Number(productCount.count),
    sellers: Number(sellerCount.count),
    totalListedValue: Number(revenue.total),
  };
}

async function getRecentProducts() {
  return sql`
    SELECT p.title, p.slug, p.status, p.price_cents, p.created_at, pr.username as seller
    FROM public.products p
    LEFT JOIN public.profiles pr ON p.seller_id = pr.id
    ORDER BY p.created_at DESC LIMIT 10
  `;
}

async function getRecentUsers() {
  return sql`
    SELECT username, display_name, role, created_at
    FROM public.profiles
    ORDER BY created_at DESC LIMIT 10
  `;
}

export default async function AdminDashboard() {
  const [stats, recentProducts, recentUsers] = await Promise.all([
    getStats(),
    getRecentProducts(),
    getRecentUsers(),
  ]);

  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <AdminShellBar
        end={
          <>
            <Link href="/admin" className="hover:underline font-bold text-xs">
              Dashboard
            </Link>
            <Link href="/admin/users" className="hover:underline text-xs">
              Users
            </Link>
            <Link href="/admin/products" className="hover:underline text-xs">
              Products
            </Link>
            <Link href="/admin/analytics" className="hover:underline text-xs">
              Analytics
            </Link>
            <Link href="/admin/config" className="hover:underline text-xs">
              Config
            </Link>
          </>
        }
      />

      <main className="max-w-6xl mx-auto p-4 px-4">
        <h1 className="font-display text-2xl font-bold mb-6">Admin dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Users</div>
            <div className="text-3xl font-bold mt-1">{stats.users}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Products</div>
            <div className="text-3xl font-bold mt-1">{stats.products}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Sellers</div>
            <div className="text-3xl font-bold mt-1">{stats.sellers}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Listed Value</div>
            <div className="text-3xl font-bold mt-1">${(stats.totalListedValue / 100).toFixed(0)}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/submit" className="bg-souq-terra text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-souq-terra-hover">+ Add Product</Link>
            <Link href="/admin/users" className="bg-souq-card border border-souq-border text-xs font-bold px-3 py-1.5 rounded hover:bg-souq-raised">Manage Users</Link>
            <Link href="/admin/products" className="bg-souq-card border border-souq-border text-xs font-bold px-3 py-1.5 rounded hover:bg-souq-raised">Manage Products</Link>
            <Link href="/admin/config" className="bg-souq-card border border-souq-border text-xs font-bold px-3 py-1.5 rounded hover:bg-souq-raised">Site Config</Link>
            <form action="/api/auth/login" method="POST" className="inline">
              <input type="hidden" name="username" value="admin" />
              <button type="submit" className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-green-700">Login as Admin</button>
            </form>
          </div>
        </div>

        {/* Recent Products */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Recent Products</h2>
          <div className="bg-souq-card border border-souq-line rounded overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-souq-raised border-b text-xs uppercase tracking-wider text-souq-muted">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Seller</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-souq-line">
                {recentProducts.map((p: any) => (
                  <tr key={p.slug} className="hover:bg-souq-raised">
                    <td className="px-3 py-2 font-medium">{p.title}</td>
                    <td className="px-3 py-2 text-souq-muted">{p.seller || "—"}</td>
                    <td className="px-3 py-2">{p.price_cents === 0 ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-1.5 py-0.5 rounded ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-souq-raised text-souq-muted"}`}>{p.status}</span></td>
                    <td className="px-3 py-2 text-xs text-souq-faint">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Recent Users</h2>
          <div className="bg-souq-card border border-souq-line rounded overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-souq-raised border-b text-xs uppercase tracking-wider text-souq-muted">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Display Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-souq-line">
                {recentUsers.map((u: any) => (
                  <tr key={u.username} className="hover:bg-souq-raised">
                    <td className="px-3 py-2 font-medium">{u.username}</td>
                    <td className="px-3 py-2 text-souq-muted">{u.display_name || "—"}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-1.5 py-0.5 rounded ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "seller" ? "bg-blue-100 text-blue-700" : "bg-souq-raised text-souq-muted"}`}>{u.role}</span></td>
                    <td className="px-3 py-2 text-xs text-souq-faint">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-souq-border mt-8 py-4 text-center text-[11px] text-souq-faint">
        © 2026 SOUQ.GG Admin
      </footer>
    </div>
  );
}