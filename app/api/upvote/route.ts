import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";


export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Check product exists
    const [product] = await sql`SELECT id FROM public.products WHERE id = ${productId}`;
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already upvoted
    const existing = await sql`
      SELECT id FROM public.upvotes
      WHERE product_id = ${productId} AND user_id = ${session.userId as string}
    `;

    if (existing.length > 0) {
      // Remove upvote (toggle off)
      await sql`DELETE FROM public.upvotes WHERE product_id = ${productId} AND user_id = ${session.userId as string}`;
      await sql`UPDATE public.products SET upvotes = upvotes - 1 WHERE id = ${productId}`;
      return NextResponse.json({ success: true, upvoted: false });
    } else {
      // Add upvote
      await sql`
        INSERT INTO public.upvotes (product_id, user_id)
        VALUES (${productId}, ${session.userId as string})
        ON CONFLICT DO NOTHING
      `;
      await sql`UPDATE public.products SET upvotes = upvotes + 1 WHERE id = ${productId}`;
      return NextResponse.json({ success: true, upvoted: true });
    }
  } catch (e: any) {
    console.error("Upvote error:", e);
    return NextResponse.json({ error: "Failed to toggle upvote" }, { status: 500 });
  }
}