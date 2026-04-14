import Link from "next/link";

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
    <div className="min-h-screen flex flex-col bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
      </nav>

      <main className="flex-1 max-w-md mx-auto p-4 mt-20 text-center">
        <div className="text-5xl mb-4">{isFree ? "✉️" : "✅"}</div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-600 mb-8">{message}</p>
        <Link
          href="/"
          className="inline-block bg-[#ff6600] text-white font-bold py-2.5 px-6 rounded hover:bg-[#e55c00] transition-colors"
        >
          ← Back to marketplace
        </Link>
      </main>
    </div>
  );
}