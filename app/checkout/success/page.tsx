import Link from "next/link";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const isFree = params.free === "1";
  const isPending = params.pending === "1";

  let title = "Payment Successful!";
  let message = "Your purchase is complete. Check your email for download instructions.";
  
  if (isFree) {
    title = "Access Granted!";
    message = "Check your email for the download link and access details.";
  } else if (isPending) {
    title = "Order Received";
    message = "Payment processing is being set up. You will receive your product access via email shortly.";
  }

  return (
    <div className="min-h-screen flex flex-col bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />

      <main className="flex-1 max-w-md mx-auto p-4 mt-20 text-center px-4">
        <div className="text-5xl mb-4">{isFree ? "✉️" : "✅"}</div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-souq-muted mb-8">{message}</p>
        <Link href="/" className="retro-btn inline-block">
          ← Back to marketplace
        </Link>
      </main>
    </div>
  );
}