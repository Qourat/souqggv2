import { NextResponse } from "next/server";

import { clearSessionUser } from "@/shared/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearSessionUser();
  return NextResponse.json({ ok: true });
}
