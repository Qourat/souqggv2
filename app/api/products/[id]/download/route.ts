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
    const productId = id;

    const [product] = await sql`
      SELECT p.id, p.title, p.price_cents, p.file_url, p.version, p.seller_id, p.status
      FROM products p
      WHERE p.id = ${productId} AND p.status = 'active'
    `;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.file_url) {
      return NextResponse.json({ error: 'No file available for this product' }, { status: 404 });
    }

    // SAAS pivot: all active products are downloadable; pro can be layered later.
    let hasAccess = true;

    if (!hasAccess && session?.userId) {
      const [purchase] = await sql`
        SELECT id FROM purchases
        WHERE product_id = ${productId} AND buyer_id = ${session.userId}
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

    const downloadToken = Buffer.from(
      JSON.stringify({
        productId,
        userId: session?.userId || 'anonymous',
        exp: Date.now() + 3600000,
      })
    ).toString('base64url');

    return NextResponse.json({
      success: true,
      downloadUrl: `${product.file_url}?token=${downloadToken}`,
      expiresIn: 3600,
      fileName: `${product.title.replace(/[^a-zA-Z0-9]/g, '-')}-v${product.version}`,
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}