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

    const productId = id;

    const [product] = await sql`
      SELECT id, title, price_cents, pricing_type, file_url, seller_id, status
      FROM products WHERE id = ${productId} AND status = 'active'
    `;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [existingPurchase] = await sql`
      SELECT id FROM purchases
      WHERE product_id = ${productId} AND buyer_id = ${session.userId}
      LIMIT 1
    `;

    if (!existingPurchase) {
      if (product.price_cents > 0 && product.pricing_type !== 'pwyw') {
        return NextResponse.json({
          error: 'Payment processing not yet configured. Stripe integration coming soon.',
          needsPayment: true,
          price: product.price_cents,
        }, { status: 402 });
      }

      await sql`
        INSERT INTO purchases (product_id, buyer_id, seller_id, amount_cents, status)
        VALUES (${productId}, ${session.userId}, ${product.seller_id}, ${product.price_cents}, 'completed')
      `;
    }

    const downloadUrl = new URL(`/api/products/${productId}/download`, request.url);
    return NextResponse.redirect(downloadUrl);
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}