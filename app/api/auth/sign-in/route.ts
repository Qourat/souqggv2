import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, schema } from "@/shared/db";
import { verifyPassword } from "@/shared/auth/password";
import { setSessionUser } from "@/shared/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Account access is not configured.", code: "DEPENDENCY_DOWN" },
      { status: 503 },
    );
  }

  const parsed = signInSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email or password.", code: "VALIDATION" },
      { status: 422 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.email, email))
    .limit(1);

  if (
    !profile ||
    profile.isBanned ||
    !verifyPassword(parsed.data.password, profile.passwordHash)
  ) {
    return NextResponse.json(
      { error: "Invalid email or password.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  await setSessionUser({
    id: profile.id,
    email: profile.email,
    role: profile.role as "buyer" | "admin",
  });

  return NextResponse.json({
    user: { id: profile.id, email: profile.email, role: profile.role },
  });
}
