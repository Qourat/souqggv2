import Link from "next/link";
import { sql } from "@/lib/db";


export const revalidate = 30;

async function getProducts() {
  return sql`
    SELECT p.*, c.name as category_name, pr.username as seller_username, pr.display_name as seller_display_name
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    LEFT JOIN public.profiles pr ON p.seller_id = pr.id
    ORDER BY p.created_at DESC
  `;
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link href="/admin" className="hover:underline">Dashboard</Link>
          <Link href="/admin/users" className="hover:underline">Users</Link>
          <Link href="/admin/products" className="hover:underline font-bold">Products</Link>
          <Link href="/admin/analytics" className="hover:underline">Analytics</Link>
          <Link href="/admin/config" className="hover:underline">Config</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Product Management</h1>
          <Link href="/submit" className="bg-[#ff6600] text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-[#e55c00]">+ Add Product</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Seller</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Upvotes</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{p.seller_username || "—"}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.category_name || "—"}</td>
                  <td className="px-3 py-2">{p.price_cents === 0 ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      p.status === "active" ? "bg-green-100 text-green-700" :
                      p.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2 text-center">{p.upvotes}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <form action="/api/admin/products" method="POST">
                        <input type="hidden" name="productId" value={p.id} />
                        <input type="hidden" name="action" value={p.status === "active" ? "archive" : "publish"} />
                        <button type="submit" className="text-[10px] px-2 py-0.5 rounded bg-gray-50 hover:bg-gray-100">
                          {p.status === "active" ? "Archive" : "Publish"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}