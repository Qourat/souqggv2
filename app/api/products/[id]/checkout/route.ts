import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';

// POST /api/products/[id]/checkout — purchase or download a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', `/products/${id}`);
      return NextResponse.redirect(loginUrl);
    }

    // Resolve product by UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const products = isUuid
      ? await sql`SELECT id, title, slug, price_cents, pricing_type, file_url, seller_id, status FROM products WHERE id = ${id} AND status = 'active'`
      : await sql`SELECT id, title, slug, price_cents, pricing_type, file_url, seller_id, status FROM products WHERE slug = ${id} AND status = 'active'`;

    const product = products[0];
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [existingPurchase] = await sql`
      SELECT id FROM purchases
      WHERE product_id = ${product.id} AND buyer_id = ${session.userId}
      LIMIT 1
    `;

    if (!existingPurchase) {
      // For paid non-pwyw products, allow download anyway (SaaS pivot: instant access)
      // Stripe can be layered on later
      const amountCents = (product.price_cents > 0 && product.pricing_type !== 'pwyw')
        ? product.price_cents
        : 0;

      await sql`
        INSERT INTO purchases (product_id, buyer_id, seller_id, amount_cents, status)
        VALUES (${product.id}, ${session.userId}, ${product.seller_id}, ${amountCents}, 'completed')
      `;
    }

    // If product has a file, redirect to download
    if (product.file_url) {
      const downloadUrl = new URL(`/api/products/${product.id}/download`, request.url);
      return NextResponse.redirect(downloadUrl);
    }

    // No file — redirect to success page
    const successUrl = new URL('/checkout/success', request.url);
    successUrl.searchParams.set('free', '1');
    successUrl.searchParams.set('product', product.slug);
    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}