import Link from "next/link";
import { sql } from "@/lib/db";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";


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
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader
        trailing={
          <Link href="/login" className="souq-badge-pill">
            Login
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto p-4 px-4">
        <h1 className="text-xl font-bold mb-4">Categories</h1>
        <div className="space-y-1">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className="flex items-center justify-between py-2 px-2 hover:bg-souq-card rounded group"
            >
              <div>
                <span className="text-sm font-medium group-hover:text-souq-terra">{cat.name}</span>
              </div>
              <span className="text-xs text-souq-muted">{cat.product_count} product{cat.product_count !== 1 ? "s" : ""}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}