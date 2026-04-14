import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth/jwt";


export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const users = await sql`
      SELECT id, username, role, display_name, bio, created_at, updated_at
      FROM public.profiles
      ORDER BY created_at ASC
    `;
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let userId: string, action: string;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      userId = body.userId;
      action = body.action;
    } else {
      const formData = await req.formData();
      userId = formData.get("userId") as string;
      action = formData.get("action") as string;
    }

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    let newRole: string;
    switch (action) {
      case "promote_seller":
        newRole = "seller";
        break;
      case "promote_admin":
        newRole = "admin";
        break;
      case "demote_buyer":
        newRole = "buyer";
        break;
      case "ban":
        newRole = "banned";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await sql`
      UPDATE public.profiles SET role = ${newRole}, updated_at = now() WHERE id = ${userId}
    `;

    const uid = session.userId as string;
    const uname = session.username as string;
    await sql`
      INSERT INTO public.audit_logs (user_id, action, metadata)
      VALUES (${uid}, 'role_change', ${JSON.stringify({ targetUserId: userId, newRole, performedBy: uname })})
    `;

    return NextResponse.json({ success: true, userId, newRole });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}