import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";


async function getProduct(slug: string) {
  const rows = await sql`
    SELECT p.*, c.name as category_name, pr.username as seller_username, pr.stripe_account_id
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    LEFT JOIN public.profiles pr ON p.seller_id = pr.id
    WHERE p.slug = ${slug} AND p.status = 'active'
  `;
  return rows[0] || null;
}

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const price = product.price_cents === 0 ? "Free" : `$${(product.price_cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen flex flex-col bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />

      <main className="flex-1 max-w-md mx-auto p-4 mt-10 w-full px-4">
        <h1 className="text-xl font-bold mb-6">Checkout</h1>

        <div className="bg-souq-card border border-souq-border rounded p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">{product.title}</span>
            <span className="font-bold">{price}</span>
          </div>
          <div className="border-t pt-2 flex justify-between items-center font-bold">
            <span>Total</span>
            <span>{price}</span>
          </div>
        </div>

        {product.price_cents === 0 ? (
          <form action="/api/checkout" method="POST" className="space-y-4">
            <input type="hidden" name="product_slug" value={product.slug} />
            <p className="text-sm text-souq-muted">Enter your email to get instant access.</p>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wide">EMAIL</label>
              <input type="email" name="email" className="w-full border border-souq-border p-2 rounded text-sm focus:border-souq-terra focus:outline-none" placeholder="you@example.com" required />
            </div>
            <button className="w-full bg-souq-terra text-white font-bold py-3 rounded hover:bg-souq-terra-hover transition-colors">
              Get Free Access
            </button>
          </form>
        ) : (
          <form action="/api/checkout" method="POST" className="space-y-4">
            <input type="hidden" name="product_slug" value={product.slug} />
            <p className="text-sm text-souq-muted">You will be redirected to Stripe to complete payment securely.</p>
            <button className="w-full bg-souq-terra text-white font-bold py-3 rounded hover:bg-souq-terra-hover transition-colors">
              Pay {price} with Stripe
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-souq-line">
          <Link href={`/product/${product.slug}`} className="text-xs text-souq-muted hover:text-souq-terra">&larr; Back to product</Link>
        </div>
      </main>

      <footer className="border-t border-souq-border mt-8 py-4 text-center text-[11px] text-souq-faint">
        <span>© 2026 SOUQ.GG &bull; Secure checkout</span>
      </footer>
    </div>
  );
}