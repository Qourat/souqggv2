import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-4">API Docs</h1>
        <p className="text-souq-muted mb-6">
          Core endpoints for products, categories, checkout, downloads, and admin operations.
        </p>
        <div className="retro-card text-souq-muted">
          <p><code>GET /api/products</code> - list products</p>
          <p><code>GET /api/categories</code> - list categories</p>
          <p><code>POST /api/checkout</code> - checkout / free access flow</p>
          <p><code>GET /api/products/:id/download</code> - signed download URL</p>
          <p><code>GET|POST /api/admin/*</code> - admin controls</p>
        </div>
        <div className="mt-6">
          <Link href="/" className="retro-btn inline-block">Back to marketplace</Link>
        </div>
      </main>
    </div>
  );
}
