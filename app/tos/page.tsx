import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default function TosPage() {
  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-4">Terms of Service</h1>
        <div className="retro-card space-y-3 text-souq-muted">
          <p>Only legal digital products are permitted on SOUQ.GG.</p>
          <p>Users are responsible for license compliance and lawful redistribution rights.</p>
          <p>Prohibited content includes stolen, infringing, malicious, or unlawful material.</p>
          <p>We reserve the right to remove content, suspend accounts, and cooperate with legal requests.</p>
        </div>
        <div className="mt-6">
          <Link href="/" className="retro-btn inline-block">Back to marketplace</Link>
        </div>
      </main>
    </div>
  );
}
