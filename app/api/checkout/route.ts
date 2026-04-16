import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";


export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const contentType = req.headers.get("content-type") || "";
    const isForm = !contentType.includes("application/json");

    // Accept both JSON and form data
    let productId: string | null = null;
    if (!isForm) {
      const body = await req.json();
      productId = body.productId || body.product_id;
    } else {
      const formData = await req.formData();
      productId = (formData.get("productId") || formData.get("product_id") || formData.get("product_slug")) as string;
    }

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Try to find product by ID or slug
    const products = await sql`
      SELECT p.*, pr.username as seller_name, pr.stripe_account_id
      FROM public.products p
      LEFT JOIN public.profiles pr ON p.seller_id = pr.id
      WHERE (p.id = ${productId} OR p.slug = ${productId}) AND p.status = 'active'
    `;
    const product = products[0];

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // SAAS pivot: make all products instantly accessible (pro/payments can be layered later).
    const effectivePriceCents = 0;
    const buyerId = session?.userId || null;

    // Only insert purchase rows when we have an authenticated buyer id.
    if (buyerId) {
      await sql`
        INSERT INTO public.purchases (buyer_id, product_id, amount_cents, status, created_at)
        VALUES (${buyerId}, ${product.id}, ${effectivePriceCents}, 'completed', now())
        ON CONFLICT DO NOTHING
      `;
    }

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
      downloadUrl: product.file_url || null,
      redirect: successUrl.toString(),
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}