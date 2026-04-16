import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";


export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && String(session.username).toLowerCase() !== "qourat")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const config = await sql`SELECT key, value, updated_at FROM public.platform_config ORDER BY key`;
    return NextResponse.json(config);
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
    let key: string, value: string;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      key = body.key;
      value = body.value;
    } else {
      const formData = await req.formData();
      key = formData.get("key") as string;
      value = formData.get("value") as string;
    }

    if (!key || value === null || value === undefined) {
      return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
    }

    await sql`
      INSERT INTO public.platform_config (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()
    `;

    return NextResponse.json({ success: true, key, value });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}