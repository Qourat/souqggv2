import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

const items = [
  ["Are products legal?", "Yes. We only allow legal digital products and lawful licenses."],
  ["Do I need an account to download?", "Not for current free access. Account features unlock profile history and pro tools."],
  ["Will pro subscription return?", "Yes. Pro SaaS features are being reintroduced with analytics and automation."],
  ["How do I report content?", "Use the product page controls or contact support through admin moderation channels."],
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-6">FAQ</h1>
        <div className="space-y-3">
          {items.map(([q, a]) => (
            <section key={q} className="retro-card">
              <h2 className="font-display text-lg font-bold mb-1">{q}</h2>
              <p className="text-souq-muted">{a}</p>
            </section>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/" className="retro-btn inline-block">Back to marketplace</Link>
        </div>
      </main>
    </div>
  );
}
