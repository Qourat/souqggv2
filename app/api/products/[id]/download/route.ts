import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';
import { isR2Configured, generatePresignedDownloadUrl } from '@/lib/storage';

// GET /api/products/[id]/download — generate expiring download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    // Resolve product by UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const products = isUuid
      ? await sql`SELECT p.id, p.title, p.slug, p.price_cents, p.file_url, p.version, p.seller_id, p.status FROM products p WHERE p.id = ${id} AND p.status = 'active'`
      : await sql`SELECT p.id, p.title, p.slug, p.price_cents, p.file_url, p.version, p.seller_id, p.status FROM products p WHERE p.slug = ${id} AND p.status = 'active'`;

    const product = products[0];
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.file_url) {
      return NextResponse.json({ error: 'No file available for this product' }, { status: 404 });
    }

    // SaaS pivot: all active products are downloadable; access control can be layered later
    let hasAccess = true;

    if (!hasAccess && session?.userId) {
      const [purchase] = await sql`
        SELECT id FROM purchases
        WHERE product_id = ${product.id} AND buyer_id = ${session.userId}
        LIMIT 1
      `;
      if (purchase) hasAccess = true;
    }

    if (!hasAccess && product.price_cents > 0) {
      if (!session?.userId) {
        return NextResponse.json({ error: 'Login required to download' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Purchase required to download' }, { status: 403 });
    }

    // R2 presigned URL
    if (isR2Configured() && product.file_url.includes('r2.cloudflarestorage.com')) {
      const key = product.file_url.split('.com/')[1];
      if (key) {
        const presignedUrl = await generatePresignedDownloadUrl(key);
        return NextResponse.json({
          success: true,
          downloadUrl: presignedUrl,
          expiresIn: 3600,
          fileName: `${product.title.replace(/[^a-zA-Z0-9]/g, '-')}-v${product.version}`,
        });
      }
    }

    // Local file — redirect directly to the file URL
    if (product.file_url.startsWith('/uploads/')) {
      return NextResponse.redirect(new URL(product.file_url, request.url));
    }

    // External URL — return as JSON with download token
    const downloadToken = Buffer.from(
      JSON.stringify({
        productId: product.id,
        userId: session?.userId || 'anonymous',
        exp: Date.now() + 3600000,
      })
    ).toString('base64url');

    return NextResponse.json({
      success: true,
      downloadUrl: `${product.file_url}?token=${downloadToken}`,
      expiresIn: 3600,
      fileName: `${product.title.replace(/[^a-zA-Z0-9]/g, '-')}-v${product.version}`,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}