import Link from "next/link";
import { sql } from "@/lib/db";
import AdminShellBar from "@/app/components/AdminShellBar";


export const revalidate = 60;

async function getAnalytics() {
  const [totalProducts] = await sql`SELECT count(*) as count FROM public.products WHERE status = 'active'`;
  const [totalUsers] = await sql`SELECT count(*) as count FROM public.profiles`;
  const [totalSellers] = await sql`SELECT count(*) as count FROM public.profiles WHERE role = 'seller'`;
  const [totalAdmins] = await sql`SELECT count(*) as count FROM public.profiles WHERE role = 'admin'`;
  const [totalListedValue] = await sql`SELECT COALESCE(SUM(price_cents), 0) as total FROM public.products WHERE status = 'active'`;
  const [avgPrice] = await sql`SELECT COALESCE(AVG(price_cents), 0) as avg FROM public.products WHERE status = 'active' AND price_cents > 0`;
  const [freeCount] = await sql`SELECT count(*) as count FROM public.products WHERE status = 'active' AND price_cents = 0`;
  const topProducts = await sql`
    SELECT p.title, p.slug, p.price_cents, p.upvotes, c.name as category
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE p.status = 'active'
    ORDER BY p.upvotes DESC LIMIT 5
  `;
  const categoryBreakdown = await sql`
    SELECT c.name, count(p.id) as product_count, COALESCE(SUM(p.upvotes), 0) as total_upvotes
    FROM public.categories c
    LEFT JOIN public.products p ON p.category_id = c.id AND p.status = 'active'
    GROUP BY c.name
    ORDER BY product_count DESC
  `;

  return {
    totalProducts: Number(totalProducts.count),
    totalUsers: Number(totalUsers.count),
    totalSellers: Number(totalSellers.count),
    totalAdmins: Number(totalAdmins.count),
    totalListedValue: Number(totalListedValue.total),
    avgPrice: Number(Number(avgPrice.avg).toFixed(0)),
    freeCount: Number(freeCount.count),
    topProducts,
    categoryBreakdown,
  };
}

export default async function AnalyticsPage() {
  const stats = await getAnalytics();

  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <AdminShellBar
        end={
          <>
            <Link href="/admin" className="hover:underline text-xs">
              Dashboard
            </Link>
            <Link href="/admin/users" className="hover:underline text-xs">
              Users
            </Link>
            <Link href="/admin/products" className="hover:underline text-xs">
              Products
            </Link>
            <Link href="/admin/analytics" className="hover:underline font-bold text-xs">
              Analytics
            </Link>
            <Link href="/admin/config" className="hover:underline text-xs">
              Config
            </Link>
          </>
        }
      />

      <main className="max-w-6xl mx-auto p-4 px-4">
        <h1 className="text-2xl font-bold mb-6">Platform Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Total Users</div>
            <div className="text-3xl font-bold mt-1">{stats.totalUsers}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Active Products</div>
            <div className="text-3xl font-bold mt-1">{stats.totalProducts}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Listed Value</div>
            <div className="text-3xl font-bold mt-1">${(stats.totalListedValue / 100).toFixed(0)}</div>
          </div>
          <div className="bg-souq-card border border-souq-line rounded p-4">
            <div className="text-xs text-souq-muted uppercase tracking-wider font-bold">Free Products</div>
            <div className="text-3xl font-bold mt-1">{stats.freeCount}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Top Products by Upvotes</h2>
            <div className="bg-souq-card border border-souq-line rounded overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-souq-raised border-b text-xs uppercase tracking-wider text-souq-muted">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Upvotes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-souq-line">
                  {stats.topProducts.map((p: any) => (
                    <tr key={p.slug} className="hover:bg-souq-raised">
                      <td className="px-3 py-2 font-medium">{p.title}</td>
                      <td className="px-3 py-2 text-xs text-souq-muted">{p.category || "—"}</td>
                      <td className="px-3 py-2">{p.price_cents === 0 ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}</td>
                      <td className="px-3 py-2 text-center">{p.upvotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-3">Category Breakdown</h2>
            <div className="bg-souq-card border border-souq-line rounded overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-souq-raised border-b text-xs uppercase tracking-wider text-souq-muted">
                  <tr>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Products</th>
                    <th className="px-3 py-2">Total Upvotes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-souq-line">
                  {stats.categoryBreakdown.map((c: any) => (
                    <tr key={c.name} className="hover:bg-souq-raised">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-center">{Number(c.product_count)}</td>
                      <td className="px-3 py-2 text-center">{Number(c.total_upvotes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-souq-card border border-souq-line rounded p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-souq-muted mb-2">User Role Distribution</h2>
          <div className="flex gap-6 text-sm">
            <div><span className="font-bold">{stats.totalSellers}</span> Sellers</div>
            <div><span className="font-bold">{stats.totalAdmins}</span> Admins</div>
            <div><span className="font-bold">{stats.totalUsers - stats.totalSellers - stats.totalAdmins}</span> Buyers</div>
          </div>
        </div>
      </main>
    </div>
  );
}