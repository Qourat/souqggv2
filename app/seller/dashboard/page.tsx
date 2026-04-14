import Link from "next/link";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";


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
      <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
        <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
          <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        </nav>
        <main className="max-w-md mx-auto p-4 mt-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You must be logged in as a seller to view this page.</p>
          <Link href="/login" className="bg-[#ff6600] text-white font-bold px-6 py-2 rounded hover:bg-[#e55c00]">
            Sign In
          </Link>
        </main>
      </div>
    );
  }

  if (user.role !== "seller" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
        <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
          <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        </nav>
        <main className="max-w-md mx-auto p-4 mt-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Upgrade Required</h1>
          <p className="text-gray-600 mb-6">You need a seller account to access the dashboard. Your current role: <strong>{user.role}</strong></p>
          <Link href="/" className="bg-gray-200 text-black font-bold px-6 py-2 rounded hover:bg-gray-300">
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  const products = await getSellerProducts(user.userId);
  const stats = await getSellerStats(user.userId);

  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href="/seller/dashboard" className="hover:underline font-bold">Dashboard</Link>
          <Link href="/submit" className="hover:underline">+ New Product</Link>
          <span className="text-[10px]">({user.username})</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Seller Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.username}</p>
          </div>
          <Link href="/submit" className="bg-[#ff6600] text-white text-sm font-bold px-4 py-2 rounded hover:bg-[#e55c00]">+ New Product</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Products</div>
            <div className="text-2xl font-bold mt-1">{stats?.total_products || 0}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Active</div>
            <div className="text-2xl font-bold mt-1">{stats?.active_products || 0}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Upvotes</div>
            <div className="text-2xl font-bold mt-1">{stats?.total_upvotes || 0}</div>
          </div>
        </div>

        {/* Product list */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-200 font-bold text-sm">Your Products</div>
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products yet. <Link href="/submit" className="text-[#ff6600] hover:underline">Create your first product</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((p: any) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <Link href={`/product/${p.slug || p.id}`} className="font-bold text-sm hover:underline">{p.title}</Link>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.category_name && <span>{p.category_name} · </span>}
                      <span>{(p.price_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                      <span> · {p.upvotes} upvotes</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
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