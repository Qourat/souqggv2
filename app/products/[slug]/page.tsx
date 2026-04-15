import Link from 'next/link';
import postgres from 'postgres';
import { notFound } from 'next/navigation';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

function formatPrice(cents: number, type: string) {
  if (type === 'pwyw') return 'Pay What You Want';
  if (cents === 0) return 'Free';
  const dollars = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  return type === 'subscription' ? `$${dollars}/month` : `$${dollars}`;
}

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product] = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           pr.username as seller_name,
           COALESCE((SELECT COUNT(*) FROM purchases WHERE product_id = p.id), 0) as sales_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN profiles pr ON p.seller_id = pr.id
    WHERE p.slug = ${slug} AND p.status = 'active'
  `;

  if (!product) notFound();

  const files = await sql`
    SELECT id, version, file_url, file_size_bytes, changelog, created_at
    FROM product_files
    WHERE product_id = ${product.id}
    ORDER BY created_at DESC
  `;

  const fileSizeMB = (bytes: number | null) => {
    if (!bytes) return '';
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <div className="text-xs text-souq-muted mb-3">
        <Link href="/" className="hover:underline">SOUQ</Link>
        <span> / </span>
        <Link href="/products" className="hover:underline">Products</Link>
        {product.category_slug && (
          <>
            <span> / </span>
            <Link href={`/products?category=${product.category_slug}`} className="hover:underline">
              {product.category_name}
            </Link>
          </>
        )}
        <span> / </span>
        <span className="text-souq-text">{product.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-souq-text">{product.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-souq-muted">
            <span>by <span className="text-souq-terra font-medium">{product.seller_name || 'unknown'}</span></span>
            <span>·</span>
            <span>{product.sales_count} sales</span>
            <span>·</span>
            <span>{timeAgo(product.created_at)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-souq-text">{formatPrice(product.price_cents, product.pricing_type)}</div>
          <form action={`/api/products/${product.id}/checkout`} method="POST">
            <button type="submit" className="mt-2 px-4 py-1.5 bg-souq-terra text-white text-sm font-medium rounded hover:bg-souq-terra-hover">
              {product.price_cents === 0 ? 'Download Free' : product.pricing_type === 'pwyw' ? 'Get It' : 'Buy Now'}
            </button>
          </form>
        </div>
      </div>

      {/* Screenshot */}
      {product.screenshot_url && (
        <div className="mb-4 border border-souq-line rounded overflow-hidden">
          <img src={product.screenshot_url} alt={product.title} className="w-full" />
        </div>
      )}

      {/* Meta bar */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {product.tags && product.tags.map((tag: string) => (
          <Link key={tag} href={`/products?q=${tag}`}
            className="px-2 py-0.5 bg-souq-raised text-souq-muted rounded hover:bg-souq-line">
            {tag}
          </Link>
        ))}
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{product.license_type}</span>
        <span className="px-2 py-0.5 bg-souq-raised text-souq-muted rounded">v{product.version}</span>
        <span className="px-2 py-0.5 bg-souq-raised text-souq-muted rounded">{product.product_type}</span>
      </div>

      {/* Upvote */}
      <div className="flex items-center gap-2 mb-4">
        <form action={`/api/products/${product.id}/upvote`} method="POST">
          <button type="submit" className="flex items-center gap-1 px-3 py-1 border border-souq-border rounded text-sm hover:bg-souq-raised hover:border-souq-terra">
            <span className="text-souq-terra">▲</span>
            <span className="font-medium">{product.upvotes}</span>
          </button>
        </form>
      </div>

      {/* Description */}
      <div className="prose prose-sm max-w-none mb-6 text-souq-text whitespace-pre-wrap">
        {product.description}
      </div>

      {/* Demo link */}
      {product.demo_url && (
        <div className="mb-4">
          <a href={product.demo_url} target="_blank" rel="noopener noreferrer"
            className="text-blue-500 text-sm hover:underline">
            Try Demo →
          </a>
        </div>
      )}

      {/* Changelog */}
      {product.changelog && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-souq-text mb-1">Changelog</h3>
          <div className="text-sm text-souq-muted whitespace-pre-wrap bg-souq-raised p-3 rounded">
            {product.changelog}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-souq-text mb-2">Files</h3>
          <div className="border border-souq-line rounded divide-y divide-souq-line">
            {files.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">v{f.version}</span>
                  {f.file_size_bytes && <span className="text-souq-faint ml-2">({fileSizeMB(f.file_size_bytes)})</span>}
                  {f.changelog && <span className="text-souq-muted ml-2">— {f.changelog}</span>}
                </div>
                <span className="text-xs text-souq-faint">{timeAgo(f.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="pt-4 border-t border-souq-line">
        <Link href="/products" className="text-sm text-souq-muted hover:underline">← Back to products</Link>
      </div>
    </div>
  );
}