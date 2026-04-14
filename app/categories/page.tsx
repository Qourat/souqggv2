import Link from "next/link";
import { sql } from "@/lib/db";


export const revalidate = 60;

async function getCategories() {
  const categories = await sql`
    SELECT c.*, COUNT(p.id) as product_count
    FROM public.categories c
    LEFT JOIN public.products p ON p.category_id = c.id AND p.status = 'active'
    GROUP BY c.id, c.name, c.slug
    ORDER BY product_count DESC, c.name
  `;
  return categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <Link href="/" className="hover:underline">new</Link>
        <span>|</span>
        <Link href="/" className="hover:underline">top</Link>
        <span>|</span>
        <Link href="/categories" className="hover:underline font-bold">categories</Link>
        <div className="ml-auto">
          <Link href="/login" className="bg-white px-2 py-0.5 rounded text-xs">Login</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Categories</h1>
        <div className="space-y-1">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className="flex items-center justify-between py-2 px-2 hover:bg-white rounded group"
            >
              <div>
                <span className="text-sm font-medium group-hover:text-[#ff6600]">{cat.name}</span>
              </div>
              <span className="text-xs text-gray-500">{cat.product_count} product{cat.product_count !== 1 ? "s" : ""}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}