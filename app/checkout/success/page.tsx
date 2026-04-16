import Link from "next/link";
import { sql } from "@/lib/db";
import SouqMarketingHeader from "@/app/components/SouqMarketingHeader";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const isFree = params.free === "1";
  const isPending = params.pending === "1";
  const isError = params.error === "1";
  const hasDownload = !!params.download;
  const hasNoFile = params.nodownload === "1";
  const productSlug = params.product || "";
  const productId = params.download || "";

  let productTitle = "";
  let fileUrl = "";
  if (productId) {
    try {
      const [product] = await sql`
        SELECT title, file_url FROM products WHERE id = ${productId}
      `;
      if (product) {
        productTitle = product.title;
        fileUrl = product.file_url || "";
      }
    } catch {}
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-souq-base font-sans text-souq-text">
        <SouqMarketingHeader />
        <main className="flex-1 max-w-md mx-auto p-4 mt-20 text-center px-4">
          <div className="text-5xl mb-4">&#10060;</div>
          <h1 className="text-2xl font-bold mb-2 text-souq-terra">Something Went Wrong</h1>
          <p className="text-sm text-souq-muted mb-8">
            We could not process your request. Please try again or contact support.
          </p>
          <Link href="/" className="retro-btn inline-block">
            &#8592; Back to marketplace
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-souq-base font-sans text-souq-text">
      <SouqMarketingHeader />

      <main className="flex-1 max-w-md mx-auto p-4 mt-20 text-center px-4">
        <div className="text-5xl mb-4">{isFree ? "&#9995;" : "&#9989;"}</div>
        <h1 className="text-2xl font-bold mb-2">
          {isFree ? "Access Granted!" : isPending ? "Order Received!" : "Purchase Complete!"}
        </h1>
        <p className="text-sm text-souq-muted mb-6">
          {hasNoFile
            ? "You now have access to this product. Visit the product page anytime to use it."
            : isPending
            ? "Payment processing is being set up. Your download will be available shortly."
            : hasDownload
            ? "Your download is ready below."
            : "Your purchase is complete."}
        </p>

        {hasDownload && fileUrl && !isPending && (
          <div className="bg-souq-card border border-souq-border rounded p-4 mb-6">
            {productTitle && (
              <p className="text-sm font-bold mb-3">{productTitle}</p>
            )}
            {fileUrl.startsWith("/uploads/") ? (
              <a
                href={fileUrl}
                className="inline-block w-full bg-souq-terra text-white font-bold py-3 rounded hover:bg-souq-terra-hover transition-colors text-center"
              >
                &#11015; Download File
              </a>
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full bg-souq-terra text-white font-bold py-3 rounded hover:bg-souq-terra-hover transition-colors text-center"
              >
                &#11015; Download File
              </a>
            )}
          </div>
        )}

        {productSlug && (
          <Link
            href={`/products/${productSlug}`}
            className="text-sm text-souq-terra hover:underline block mb-4"
          >
            View product page
          </Link>
        )}

        <Link href="/" className="retro-btn inline-block">
          &#8592; Back to marketplace
        </Link>
      </main>
    </div>
  );
}