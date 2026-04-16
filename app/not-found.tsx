import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader
        trailing={
          <Link href="/login" className="souq-badge-pill">
            Login
          </Link>
        }
      />

      <main className="max-w-md mx-auto p-4 mt-20 text-center px-4">
        <p className="font-display text-6xl font-bold text-souq-terra mb-2">404</p>
        <h1 className="font-display text-2xl font-bold mb-2">Not found</h1>
        <p className="text-sm text-souq-muted mb-8 max-w-sm mx-auto leading-relaxed">
          This page doesn&apos;t exist or may have moved. Try search or head back to the marketplace.
        </p>
        <Link href="/" className="retro-btn inline-block">
          ← Back to marketplace
        </Link>
      </main>
    </div>
  );
}
