import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";


export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && String(session.username).toLowerCase() !== "qourat")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const products = await sql`
      SELECT p.*, c.name as category_name, pr.username as seller_name, pr.display_name as seller_display_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      LEFT JOIN public.profiles pr ON p.seller_id = pr.id
      ORDER BY p.created_at DESC
    `;
    return NextResponse.json(products);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && String(session.username).toLowerCase() !== "qourat")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let productId: string, action: string;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      productId = body.productId;
      action = body.action;
    } else {
      const formData = await req.formData();
      productId = formData.get("productId") as string;
      action = formData.get("action") as string;
    }

    if (!productId || !action) {
      return NextResponse.json({ error: "Missing productId or action" }, { status: 400 });
    }

    if (action === "publish") {
      await sql`UPDATE public.products SET status = 'active' WHERE id = ${productId}`;
    } else if (action === "archive") {
      await sql`UPDATE public.products SET status = 'archived' WHERE id = ${productId}`;
    } else if (action === "delete") {
      await sql`DELETE FROM public.products WHERE id = ${productId}`;
    }

    await sql`
      INSERT INTO public.audit_logs (user_id, action, metadata)
      VALUES (${session.userId as string}, 'product_moderation', ${JSON.stringify({ productId, action, performedBy: session.username as string })})
    `;

    return NextResponse.json({ success: true, productId, action });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}