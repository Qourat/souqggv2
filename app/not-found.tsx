import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6f6ef] font-sans text-black">
      <nav className="bg-[#ff6600] px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-black overflow-x-auto whitespace-nowrap border-b border-[#e55c00]">
        <Link href="/" className="text-lg mr-2">SOUQ.GG</Link>
        <Link href="/" className="hover:underline">new</Link>
        <span>|</span>
        <Link href="/" className="hover:underline">top</Link>
        <span>|</span>
        <Link href="/categories" className="hover:underline">categories</Link>
        <div className="ml-auto">
          <Link href="/login" className="bg-white px-2 py-0.5 rounded text-xs">Login</Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto p-4 mt-20 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Not Found</h1>
        <p className="text-sm text-gray-600 mb-6">
          This page doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#ff6600] text-white font-bold py-2 px-6 rounded hover:bg-[#e55c00] transition-colors"
        >
          ← Back to marketplace
        </Link>
      </main>
    </div>
  );
}