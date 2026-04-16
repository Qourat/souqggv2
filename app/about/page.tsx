import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-4">About SOUQ.GG</h1>
        <p className="text-souq-muted mb-4">
          SOUQ.GG is a social SaaS marketplace for digital products. Creators publish legal assets,
          buyers discover and download, and teams collaborate with AI-ready workflows.
        </p>
        <p className="text-souq-muted mb-6">
          Current model: all listed legal products are instantly downloadable while we roll out pro subscriptions,
          advanced automation, and enterprise controls.
        </p>
        <div className="retro-card">
          <h2 className="font-display text-xl font-bold mb-2">Our Principles</h2>
          <ul className="list-disc pl-5 text-souq-muted space-y-1">
            <li>Legal-only distribution</li>
            <li>Fast, accessible checkout and delivery</li>
            <li>Transparent platform policies</li>
            <li>Creator-first monetization with pro tooling</li>
          </ul>
        </div>
        <div className="mt-6">
          <Link href="/" className="retro-btn inline-block">Back to marketplace</Link>
        </div>
      </main>
    </div>
  );
}
