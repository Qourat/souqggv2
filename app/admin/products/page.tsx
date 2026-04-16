import Link from "next/link";
import { sql } from "@/lib/db";
import AdminShellBar from "@/app/components/AdminShellBar";

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
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <AdminShellBar
        end={
          <>
            <Link href="/admin" className="hover:underline text-xs">Dashboard</Link>
            <Link href="/admin/users" className="hover:underline text-xs">Users</Link>
            <Link href="/admin/products" className="hover:underline font-bold text-xs">Products</Link>
            <Link href="/admin/analytics" className="hover:underline text-xs">Analytics</Link>
            <Link href="/admin/config" className="hover:underline text-xs">Config</Link>
          </>
        }
      />

      <main className="max-w-6xl mx-auto p-4 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Product Management</h1>
          <Link href="/submit" className="bg-souq-terra text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-souq-terra-hover">+ Add Product</Link>
        </div>

        <div className="bg-souq-card border border-souq-line rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-souq-raised border-b text-xs uppercase tracking-wider text-souq-muted">
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
            <tbody className="divide-y divide-souq-line">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-souq-raised">
                  <td className="px-3 py-2 font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="px-3 py-2 text-souq-muted text-xs">{p.seller_username || "—"}</td>
                  <td className="px-3 py-2 text-xs text-souq-muted">{p.category_name || "—"}</td>
                  <td className="px-3 py-2">{p.price_cents === 0 ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      p.status === "active" ? "bg-souq-sage-muted text-souq-sage" :
                      p.status === "draft" ? "bg-souq-gold-muted text-souq-gold" :
                      "bg-souq-raised text-souq-muted"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2 text-center">{p.upvotes}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <form action="/api/admin/products" method="POST">
                        <input type="hidden" name="productId" value={p.id} />
                        <input type="hidden" name="action" value={p.status === "active" ? "archive" : "publish"} />
                        <button type="submit" className="text-[10px] px-2 py-0.5 rounded bg-souq-raised hover:bg-souq-line">
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
