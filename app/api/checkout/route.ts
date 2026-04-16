import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";

// Helper: resolve product by UUID or slug
async function resolveProduct(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const products = isUuid
    ? await sql`SELECT p.*, pr.username as seller_name, pr.stripe_account_id FROM public.products p LEFT JOIN public.profiles pr ON p.seller_id = pr.id WHERE p.id = ${idOrSlug} AND p.status = 'active'`
    : await sql`SELECT p.*, pr.username as seller_name, pr.stripe_account_id FROM public.products p LEFT JOIN public.profiles pr ON p.seller_id = pr.id WHERE p.slug = ${idOrSlug} AND p.status = 'active'`;
  return products[0] || null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const contentType = req.headers.get("content-type") || "";
    const isForm = !contentType.includes("application/json");

    // Accept both JSON and form data
    let productId: string | null = null;
    if (!isForm) {
      const body = await req.json();
      productId = body.productId || body.product_id || body.product_slug;
    } else {
      const formData = await req.formData();
      productId = (formData.get("productId") || formData.get("product_id") || formData.get("product_slug")) as string;
    }

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Resolve product by ID or slug
    const product = await resolveProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // SaaS pivot: make all products instantly accessible (payments can be layered later)
    const buyerId = session?.userId || null;

    // Insert purchase row when we have an authenticated buyer
    if (buyerId) {
      await sql`
        INSERT INTO public.purchases (buyer_id, seller_id, product_id, amount_cents, status, created_at)
        VALUES (${buyerId}, ${product.seller_id}, ${product.id}, ${product.price_cents}, 'completed', now())
        ON CONFLICT DO NOTHING
      `;
    }

    // If product has a downloadable file, redirect to download
    if (product.file_url) {
      const downloadUrl = new URL(`/api/products/${product.id}/download`, req.url);
      if (isForm) {
        return NextResponse.redirect(downloadUrl);
      }
      return NextResponse.json({
        success: true,
        free: true,
        productId: product.id,
        productTitle: product.title,
        downloadUrl: `/api/products/${product.id}/download`,
        redirect: downloadUrl.toString(),
      });
    }

    // No file — redirect to success page
    const successUrl = new URL("/checkout/success", req.url);
    successUrl.searchParams.set("free", "1");
    successUrl.searchParams.set("product", product.slug);

    if (isForm) {
      return NextResponse.redirect(successUrl);
    }

    return NextResponse.json({
      success: true,
      free: true,
      productId: product.id,
      productTitle: product.title,
      downloadUrl: null,
      redirect: successUrl.toString(),
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}