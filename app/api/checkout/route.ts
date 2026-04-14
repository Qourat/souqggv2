import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";


export async function POST(req: NextRequest) {
  const session = await getSession();

  // Accept both JSON and form data
  let productId: string | null = null;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
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

  // Create a purchase record
  const buyerId = session ? (session.userId as string) : null;
  const purchaseResult = await sql`
    INSERT INTO public.purchases (buyer_id, product_id, amount_cents, status, created_at)
    VALUES (${buyerId}, ${product.id}, ${product.price_cents}, 'completed', now())
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  // For free products, complete immediately
  if (product.price_cents === 0) {
    return NextResponse.json({
      success: true,
      free: true,
      productId: product.id,
      productTitle: product.title,
      downloadUrl: product.file_url || null,
    });
  }

  // Stripe not yet configured - return success with pending
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === "***") {
    return NextResponse.json({
      success: true,
      pending: true,
      productId: product.id,
      productTitle: product.title,
      priceCents: product.price_cents,
      message: "Payment processing not yet configured. Your purchase has been recorded.",
    });
  }

  // When Stripe is configured, create a real checkout session
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: product.title },
        unit_amount: product.price_cents,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL || "https://souq.gg"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL || "https://souq.gg"}/product/${product.slug}`,
    metadata: { product_id: product.id, buyer_id: buyerId || "" },
  });

  return NextResponse.json({ success: true, checkoutUrl: checkoutSession.url });
}