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
      // SaaS pivot: instant access for all products. Stripe can be layered on later.
      const amountCents = (product.price_cents > 0 && product.pricing_type !== 'pwyw')
        ? product.price_cents
        : 0;

      await sql`
        INSERT INTO purchases (product_id, buyer_id, seller_id, amount_cents, status)
        VALUES (${product.id}, ${session.userId}, ${product.seller_id}, ${amountCents}, 'completed')
      `;
    }

    // Always redirect to the success page with product info
    const successUrl = new URL('/checkout/success', request.url);
    successUrl.searchParams.set('product', product.slug);

    if (product.file_url) {
      // Has a file — mark as downloadable on success page
      successUrl.searchParams.set('download', product.id);
      if (product.price_cents > 0 && product.pricing_type !== 'pwyw') {
        successUrl.searchParams.set('pending', '1');
      } else {
        successUrl.searchParams.set('free', '1');
      }
    } else {
      // No file — digital access / SaaS product
      successUrl.searchParams.set('free', '1');
      successUrl.searchParams.set('nodownload', '1');
    }

    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('Checkout error:', error);
    const errorUrl = new URL('/checkout/success', request.url);
    errorUrl.searchParams.set('error', '1');
    return NextResponse.redirect(errorUrl);
  }
}